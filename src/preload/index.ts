import { contextBridge, ipcRenderer } from 'electron'
import type { CronJobData } from '../main/crontabService'

const electronAPI = {
  getJobs: (): Promise<CronJobData[]> => ipcRenderer.invoke('crontab:getJobs'),
  saveJob: (job: CronJobData): Promise<void> => ipcRenderer.invoke('crontab:saveJob', job),
  deleteJob: (id: string): Promise<void> => ipcRenderer.invoke('crontab:deleteJob', id),
  onNewJobRequested: (callback: () => void): void => {
    ipcRenderer.on('touchbar:new-job', () => callback())
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electronAPI', electronAPI)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.electronAPI = electronAPI
}
