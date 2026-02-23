import type { CronJobData, LogEntry, MacronConfig } from './index'

declare global {
  interface Window {
    electronAPI: {
      // Crontab operations
      getJobs: () => Promise<CronJobData[]>
      saveJob: (job: CronJobData) => Promise<void>
      deleteJob: (id: string) => Promise<void>
      onNewJobRequested: (callback: () => void) => void
      
      // Macron home folder operations
      ensureMacronHome: () => Promise<void>
      readLog: (lines?: number) => Promise<LogEntry[]>
      clearLog: () => Promise<void>
      
      // Config operations
      getConfig: () => Promise<MacronConfig>
      setConfig: (config: Partial<MacronConfig>) => Promise<void>
      
      // Scripts folder
      listScripts: () => Promise<string[]>
      
      // Directory dialog
      selectDirectory: () => Promise<string | null>
    }
  }
}

export {}
