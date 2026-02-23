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

export interface LogEntry {
  timestamp: string
  jobId: string
  jobName: string
  mode: CopilotMode | 'shell'
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

export interface SchedulePreset {
  label: string
  value: string
  description: string
}

export const SCHEDULE_PRESETS: SchedulePreset[] = [
  { label: 'Every minute', value: '* * * * *', description: 'Runs every minute' },
  { label: 'Hourly', value: '0 * * * *', description: 'At the start of every hour' },
  { label: 'Daily at 9am', value: '0 9 * * *', description: 'Every day at 9:00 AM' },
  { label: 'Weekdays at 9am', value: '0 9 * * 1-5', description: 'Mon–Fri at 9:00 AM' },
  { label: 'Weekly (Mon)', value: '0 9 * * 1', description: 'Every Monday at 9:00 AM' },
  { label: 'Monthly (1st)', value: '0 9 1 * *', description: 'On the 1st of each month' }
]
