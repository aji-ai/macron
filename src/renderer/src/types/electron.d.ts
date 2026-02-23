import type { CronJobData } from './index'

declare global {
  interface Window {
    electronAPI: {
      getJobs: () => Promise<CronJobData[]>
      saveJob: (job: CronJobData) => Promise<void>
      deleteJob: (id: string) => Promise<void>
      onNewJobRequested: (callback: () => void) => void
    }
  }
}

export {}
