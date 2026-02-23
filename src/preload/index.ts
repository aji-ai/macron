import { contextBridge, ipcRenderer } from 'electron'
import type { CronJobData, LogEntry, MacronConfig } from '../main/crontabService'

const electronAPI = {
  // Crontab operations
  getJobs: (): Promise<CronJobData[]> => ipcRenderer.invoke('crontab:getJobs'),
  saveJob: (job: CronJobData): Promise<void> => ipcRenderer.invoke('crontab:saveJob', job),
  deleteJob: (id: string): Promise<void> => ipcRenderer.invoke('crontab:deleteJob', id),
  onNewJobRequested: (callback: () => void): void => {
    ipcRenderer.on('touchbar:new-job', () => callback())
  },

  // Macron home folder operations
  ensureMacronHome: (): Promise<void> => ipcRenderer.invoke('macron:ensureHome'),
  readLog: (lines?: number): Promise<LogEntry[]> => ipcRenderer.invoke('macron:readLog', lines),
  clearLog: (): Promise<void> => ipcRenderer.invoke('macron:clearLog'),

  // Config operations
  getConfig: (): Promise<MacronConfig> => ipcRenderer.invoke('macron:getConfig'),
  setConfig: (config: Partial<MacronConfig>): Promise<void> =>
    ipcRenderer.invoke('macron:setConfig', config),

  // Scripts folder
  listScripts: (): Promise<string[]> => ipcRenderer.invoke('macron:listScripts'),

  // Directory dialog
  selectDirectory: (): Promise<string | null> => ipcRenderer.invoke('macron:selectDirectory')
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
