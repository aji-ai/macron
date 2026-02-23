import { createRequire } from 'module'
import { writeFileSync, mkdirSync, unlinkSync } from 'fs'
import { getLogFilePath, getMacronHome } from './macronHomeService'
import type { LogEntry, MacronConfig } from './macronHomeService'

// Re-export types for preload
export type { LogEntry, MacronConfig }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CronTab: any = createRequire(import.meta.url)('crontab')

export type CopilotMode = 'ask' | 'plan' | 'safe' | 'agent'

export interface PipelineStep {
  mode: CopilotMode
  prompt: string
}

export interface CronJobData {
  id: string
  name: string
  command: string
  schedule: string
  // Copilot-specific fields
  type?: 'shell' | 'copilot'
  copilotMode?: CopilotMode
  workingDir?: string
  prompt?: string
  pipelineSteps?: PipelineStep[]
  logEnabled?: boolean
}

/**
 * Escape a string for safe use inside single quotes in shell
 */
function shellEscape(str: string): string {
  return str.replace(/'/g, "'\\''")
}

/**
 * Generate a wrapper script that logs output as JSON lines.
 * Creates a script file in ~/.macron/scripts/ to avoid complex escaping.
 */
function generateLogWrapper(
  jobId: string,
  jobName: string,
  mode: CopilotMode | 'shell',
  innerCommand: string
): string {
  const logFile = getLogFilePath()
  const scriptsDir = getMacronHome() + '/scripts'
  const scriptPath = `${scriptsDir}/job-${jobId}.sh`
  const tokenFile = getMacronHome() + '/github-token'
  const homeDir = getMacronHome().replace('/.macron', '')

  // Create a script file with proper escaping
  // Set up environment for cron (which has minimal env vars)
  // Include NVM node path so MCP servers (e.g. workiq via npx) can be found
  const scriptContent = `#!/bin/zsh
# Set up environment for cron
export HOME="${homeDir}"

# Source NVM if available so npx/node are on PATH (needed by MCP servers)
export NVM_DIR="$HOME/.nvm"
[[ -s "$NVM_DIR/nvm.sh" ]] && source "$NVM_DIR/nvm.sh"

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

# Read GitHub token from file (cron can't access keychain)
if [[ -f "${tokenFile}" ]]; then
  _token=$(cat "${tokenFile}")
  export GH_TOKEN="$_token"
  export GITHUB_TOKEN="$_token"
  export COPILOT_GITHUB_TOKEN="$_token"
fi

_out=$(${innerCommand} 2>&1)
_exit=$?
_ts=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
# Escape backslashes, quotes, and newlines for JSON
_esc=$(printf '%s' "$_out" | sed 's/\\\\/\\\\\\\\/g; s/"/\\\\"/g' | awk 'BEGIN{ORS=""} NR>1{printf "\\\\n"} {printf "%s", $0}')
printf '%s\\n' "{\\"timestamp\\":\\"$_ts\\",\\"jobId\\":\\"${jobId}\\",\\"jobName\\":\\"${jobName.replace(/"/g, '\\"')}\\",\\"mode\\":\\"${mode}\\",\\"command\\":\\"scheduled\\",\\"output\\":\\"$_esc\\",\\"exitCode\\":$_exit}" >> "${logFile}"
exit $_exit
`

  // Write the script file synchronously (this runs in main process)
  mkdirSync(scriptsDir, { recursive: true })
  writeFileSync(scriptPath, scriptContent, { mode: 0o755 })

  // Return a simple command that executes the script
  return `/bin/zsh "${scriptPath}"`
}

/**
 * Generate the copilot command for a single step
 */
function generateCopilotCommand(mode: CopilotMode, prompt: string): string {
  const escapedPrompt = shellEscape(prompt)
  return `cp-${mode} '${escapedPrompt}'`
}

/**
 * Build the full command string for a copilot job
 * The command sources copilot-modes.zsh and runs in the working directory
 */
export function buildCopilotCommand(job: CronJobData): string {
  const workingDir = job.workingDir || getMacronHome() + '/workspace'
  // Source the copilot modes file which defines cp-ask, cp-plan, etc.
  const copilotModesSource = 'source "$HOME/.config/copilot-modes/copilot-modes.zsh"'

  let copilotCommand: string

  if (job.pipelineSteps && job.pipelineSteps.length > 0) {
    // Pipeline mode: chain multiple steps with pipes
    const pipelineCommands = job.pipelineSteps.map((step) =>
      generateCopilotCommand(step.mode, step.prompt)
    )
    copilotCommand = pipelineCommands.join(' | ')
  } else if (job.copilotMode && job.prompt) {
    // Single command mode
    copilotCommand = generateCopilotCommand(job.copilotMode, job.prompt)
  } else {
    // Fallback to raw command if copilot fields not set
    copilotCommand = job.command
  }

  // Build the inner command: cd, source copilot-modes, run copilot command
  const innerCommand = `cd '${shellEscape(workingDir)}' && ${copilotModesSource} && ${copilotCommand}`

  // Wrap with logging if enabled (default true for copilot jobs)
  if (job.logEnabled !== false) {
    const mode = job.pipelineSteps?.length
      ? 'agent' // Use 'agent' as mode label for pipelines
      : job.copilotMode || 'shell'
    return generateLogWrapper(job.id, job.name, mode, innerCommand)
  }

  // Without logging, still wrap in zsh with proper PATH
  const script = `export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"; ${innerCommand}`
  return `/bin/zsh -c '${shellEscape(script)}'`
}

/**
 * Determine the actual command to store in crontab
 */
function getEffectiveCommand(job: CronJobData): string {
  if (job.type === 'copilot') {
    return buildCopilotCommand(job)
  }
  // Shell jobs: optionally wrap with logging
  if (job.logEnabled) {
    return generateLogWrapper(job.id, job.name, 'shell', job.command)
  }
  return job.command
}

function parseComment(comment: string): { name: string; id: string } | null {
  const idx = comment.lastIndexOf('||')
  if (idx === -1) return null
  const name = comment.slice(0, idx)
  const id = comment.slice(idx + 2)
  // Basic UUID validation
  if (!/^[0-9a-f-]{36}$/.test(id)) return null
  return { name, id }
}

function serializeComment(name: string, id: string): string {
  return `${name}||${id}`
}

function loadTab(): Promise<any> {
  return new Promise((resolve, reject) => {
    CronTab.load((err: Error | null, tab: any) => {
      if (err) reject(err)
      else resolve(tab)
    })
  })
}

function saveTab(tab: any): Promise<void> {
  return new Promise((resolve, reject) => {
    tab.save((err: Error | null) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

export async function getJobs(): Promise<CronJobData[]> {
  const tab = await loadTab()
  const jobs: CronJobData[] = []
  for (const job of tab.jobs()) {
    const comment = String(job.comment() ?? '')
    const parsed = parseComment(comment)
    if (!parsed) continue
    jobs.push({
      id: parsed.id,
      name: parsed.name,
      command: String(job.command()),
      schedule: `${job.minute()} ${job.hour()} ${job.dom()} ${job.month()} ${job.dow()}`
    })
  }
  return jobs
}

export async function saveJob(data: CronJobData): Promise<void> {
  const tab = await loadTab()
  const comment = serializeComment(data.name, data.id)

  // Remove any existing job with the same UUID
  const existing = tab.jobs().find((j: any) => {
    const c = String(j.comment() ?? '')
    const p = parseComment(c)
    return p?.id === data.id
  })
  if (existing) {
    tab.remove(existing)
  }

  // Determine the effective command (with copilot wrapper if needed)
  const effectiveCommand = getEffectiveCommand(data)

  // Create the (new or updated) job
  tab.create(effectiveCommand, data.schedule, comment)

  await saveTab(tab)
}

export async function deleteJob(id: string): Promise<void> {
  const tab = await loadTab()
  const job = tab.jobs().find((j: any) => {
    const c = String(j.comment() ?? '')
    const p = parseComment(c)
    return p?.id === id
  })
  if (job) {
    tab.remove(job)
    await saveTab(tab)

    // Clean up the script file if it exists
    const scriptPath = `${getMacronHome()}/scripts/job-${id}.sh`
    try {
      unlinkSync(scriptPath)
    } catch {
      // Script file might not exist, ignore
    }
  }
}
