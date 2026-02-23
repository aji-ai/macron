import { app, shell, BrowserWindow, ipcMain, TouchBar } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import * as crontabService from './crontabService'

const { TouchBarButton } = TouchBar

// Fix PATH for packaged app so crontab binary is found
if (process.platform === 'darwin' && app.isPackaged) {
  process.env.PATH = `/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:${process.env.PATH ?? ''}`
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 820,
    height: 638,
    minWidth: 640,
    minHeight: 480,
    show: false,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 12, y: 16 },
    vibrancy: 'sidebar',
    visualEffectState: 'active',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // TouchBar: "New Job" button sends IPC to renderer
  const touchBar = new TouchBar({
    items: [
      new TouchBarButton({
        label: '＋ New Job',
        click: () => {
          mainWindow.webContents.send('touchbar:new-job')
        }
      })
    ]
  })
  mainWindow.setTouchBar(touchBar)

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// IPC handlers
ipcMain.handle('crontab:getJobs', async () => {
  return await crontabService.getJobs()
})

ipcMain.handle('crontab:saveJob', async (_event, job) => {
  await crontabService.saveJob(job)
})

ipcMain.handle('crontab:deleteJob', async (_event, id: string) => {
  await crontabService.deleteJob(id)
})

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.aji-ai.macroni')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
