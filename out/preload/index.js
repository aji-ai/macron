"use strict";
const electron = require("electron");
const electronAPI = {
  getJobs: () => electron.ipcRenderer.invoke("crontab:getJobs"),
  saveJob: (job) => electron.ipcRenderer.invoke("crontab:saveJob", job),
  deleteJob: (id) => electron.ipcRenderer.invoke("crontab:deleteJob", id),
  onNewJobRequested: (callback) => {
    electron.ipcRenderer.on("touchbar:new-job", () => callback());
  }
};
if (process.contextIsolated) {
  try {
    electron.contextBridge.exposeInMainWorld("electronAPI", electronAPI);
  } catch (error) {
    console.error(error);
  }
} else {
  window.electronAPI = electronAPI;
}
