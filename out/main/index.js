"use strict";
const electron = require("electron");
const path = require("path");
const utils = require("@electron-toolkit/utils");
const module$1 = require("module");
const CronTab = module$1.createRequire(require("url").pathToFileURL(__filename).href)("crontab");
function parseComment(comment) {
  const idx = comment.lastIndexOf("||");
  if (idx === -1) return null;
  const name = comment.slice(0, idx);
  const id = comment.slice(idx + 2);
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  return { name, id };
}
function serializeComment(name, id) {
  return `${name}||${id}`;
}
function loadTab() {
  return new Promise((resolve, reject) => {
    CronTab.load((err, tab) => {
      if (err) reject(err);
      else resolve(tab);
    });
  });
}
function saveTab(tab) {
  return new Promise((resolve, reject) => {
    tab.save((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}
async function getJobs() {
  const tab = await loadTab();
  const jobs = [];
  for (const job of tab.jobs()) {
    const comment = String(job.comment() ?? "");
    const parsed = parseComment(comment);
    if (!parsed) continue;
    jobs.push({
      id: parsed.id,
      name: parsed.name,
      command: String(job.command()),
      schedule: `${job.minute()} ${job.hour()} ${job.dom()} ${job.month()} ${job.dow()}`
    });
  }
  return jobs;
}
async function saveJob(data) {
  const tab = await loadTab();
  const comment = serializeComment(data.name, data.id);
  const existing = tab.jobs().find((j) => {
    const c = String(j.comment() ?? "");
    const p = parseComment(c);
    return p?.id === data.id;
  });
  if (existing) {
    tab.remove(existing);
  }
  tab.create(data.command, data.schedule, comment);
  await saveTab(tab);
}
async function deleteJob(id) {
  const tab = await loadTab();
  const job = tab.jobs().find((j) => {
    const c = String(j.comment() ?? "");
    const p = parseComment(c);
    return p?.id === id;
  });
  if (job) {
    tab.remove(job);
    await saveTab(tab);
  }
}
const { TouchBarButton } = electron.TouchBar;
if (process.platform === "darwin" && electron.app.isPackaged) {
  process.env.PATH = `/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:${process.env.PATH ?? ""}`;
}
function createWindow() {
  const mainWindow = new electron.BrowserWindow({
    width: 820,
    height: 638,
    minWidth: 640,
    minHeight: 480,
    show: false,
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 12, y: 16 },
    vibrancy: "sidebar",
    visualEffectState: "active",
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });
  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });
  mainWindow.webContents.setWindowOpenHandler((details) => {
    electron.shell.openExternal(details.url);
    return { action: "deny" };
  });
  const touchBar = new electron.TouchBar({
    items: [
      new TouchBarButton({
        label: "＋ New Job",
        click: () => {
          mainWindow.webContents.send("touchbar:new-job");
        }
      })
    ]
  });
  mainWindow.setTouchBar(touchBar);
  if (utils.is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}
electron.ipcMain.handle("crontab:getJobs", async () => {
  return await getJobs();
});
electron.ipcMain.handle("crontab:saveJob", async (_event, job) => {
  await saveJob(job);
});
electron.ipcMain.handle("crontab:deleteJob", async (_event, id) => {
  await deleteJob(id);
});
electron.app.whenReady().then(() => {
  utils.electronApp.setAppUserModelId("com.owenmelbourne.macron");
  electron.app.on("browser-window-created", (_, window) => {
    utils.optimizer.watchWindowShortcuts(window);
  });
  createWindow();
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
