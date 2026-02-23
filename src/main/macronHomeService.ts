import { promises as fs } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

export interface LogEntry {
  timestamp: string
  jobId: string
  jobName: string
  mode: 'ask' | 'plan' | 'safe' | 'agent' | 'shell'
  command: string
  output: string
  exitCode: number
  error?: string
}

export interface MacronConfig {
  defaultWorkingDir: string
  logRetentionDays: number
  models: {
    ask: string
    plan: string
    safe: string
    agent: string
  }
}

const MACRON_HOME = join(homedir(), '.macron')
const WORKSPACE_DIR = join(MACRON_HOME, 'workspace')
const SCRIPTS_DIR = join(MACRON_HOME, 'scripts')
const LOGS_DIR = join(MACRON_HOME, 'logs')
const LOG_FILE = join(LOGS_DIR, 'copilot.log')
const CONFIG_FILE = join(MACRON_HOME, 'config.json')

const DEFAULT_CONFIG: MacronConfig = {
  defaultWorkingDir: WORKSPACE_DIR,
  logRetentionDays: 30,
  models: {
    ask: 'claude-haiku-4.5',
    plan: 'gpt-4.1',
    safe: 'gpt-4.1',
    agent: 'gpt-4.1'
  }
}

export function getMacronHome(): string {
  return MACRON_HOME
}

export function getLogFilePath(): string {
  return LOG_FILE
}

export function getScriptsDir(): string {
  return SCRIPTS_DIR
}

export async function ensureMacronHome(): Promise<void> {
  // Create directory structure
  await fs.mkdir(MACRON_HOME, { recursive: true })
  await fs.mkdir(WORKSPACE_DIR, { recursive: true })
  await fs.mkdir(SCRIPTS_DIR, { recursive: true })
  await fs.mkdir(LOGS_DIR, { recursive: true })

  // Create config file if it doesn't exist
  try {
    await fs.access(CONFIG_FILE)
  } catch {
    await fs.writeFile(CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf-8')
  }

  // Create empty log file if it doesn't exist
  try {
    await fs.access(LOG_FILE)
  } catch {
    await fs.writeFile(LOG_FILE, '', 'utf-8')
  }
}

export async function getConfig(): Promise<MacronConfig> {
  try {
    const content = await fs.readFile(CONFIG_FILE, 'utf-8')
    const parsed = JSON.parse(content)
    // Merge with defaults in case new fields were added
    return { ...DEFAULT_CONFIG, ...parsed }
  } catch {
    return DEFAULT_CONFIG
  }
}

export async function setConfig(updates: Partial<MacronConfig>): Promise<void> {
  const current = await getConfig()
  const merged = { ...current, ...updates }
  await fs.writeFile(CONFIG_FILE, JSON.stringify(merged, null, 2), 'utf-8')
}

export async function readLog(lines?: number): Promise<LogEntry[]> {
  try {
    const content = await fs.readFile(LOG_FILE, 'utf-8')
    const allLines = content.trim().split('\n').filter(Boolean)
    const entries: LogEntry[] = []

    for (const line of allLines) {
      try {
        entries.push(JSON.parse(line))
      } catch {
        // Skip malformed lines
      }
    }

    // Apply retention policy - filter out entries older than N days
    const config = await getConfig()
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - config.logRetentionDays)
    const filteredEntries = entries.filter((entry) => {
      const entryDate = new Date(entry.timestamp)
      return entryDate >= cutoffDate
    })

    // Return most recent entries first
    const sorted = filteredEntries.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    if (lines !== undefined && lines > 0) {
      return sorted.slice(0, lines)
    }
    return sorted
  } catch {
    return []
  }
}

export async function appendLog(entry: LogEntry): Promise<void> {
  const line = JSON.stringify(entry) + '\n'
  await fs.appendFile(LOG_FILE, line, 'utf-8')
}

export async function clearLog(): Promise<void> {
  await fs.writeFile(LOG_FILE, '', 'utf-8')
}

export async function cleanupOldLogs(): Promise<void> {
  const config = await getConfig()
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - config.logRetentionDays)

  try {
    const content = await fs.readFile(LOG_FILE, 'utf-8')
    const lines = content.trim().split('\n').filter(Boolean)
    const keptLines: string[] = []

    for (const line of lines) {
      try {
        const entry: LogEntry = JSON.parse(line)
        const entryDate = new Date(entry.timestamp)
        if (entryDate >= cutoffDate) {
          keptLines.push(line)
        }
      } catch {
        // Skip malformed lines
      }
    }

    await fs.writeFile(LOG_FILE, keptLines.join('\n') + (keptLines.length ? '\n' : ''), 'utf-8')
  } catch {
    // File doesn't exist or other error - ignore
  }
}

export async function listScripts(): Promise<string[]> {
  try {
    const files = await fs.readdir(SCRIPTS_DIR)
    return files.filter((f) => f.endsWith('.sh') || f.endsWith('.zsh') || f.endsWith('.txt'))
  } catch {
    return []
  }
}
