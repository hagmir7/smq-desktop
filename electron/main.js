const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

const isDev = process.env.NODE_ENV === 'development';

// --- Logging setup (also used by electron-updater internally) ---
log.transports.file.level = 'info';
autoUpdater.logger = log;

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('closed', () => (mainWindow = null));
}

function sendToRenderer(channel, ...args) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, ...args);
  }
}

// --- Auto-update wiring ---
// electron-builder's "publish" config in package.json (generic/GitHub/S3)
// tells electron-updater where to look for a latest.yml + installer.
// None of this does anything in dev mode or for unpackaged/unsigned builds.
function setupAutoUpdater() {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-available', (info) => {
    log.info('Update available:', info.version);
    sendToRenderer('update:available', info);
  });

  autoUpdater.on('download-progress', (progress) => {
    sendToRenderer('update:download-progress', progress);
  });

  autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded:', info.version);
    sendToRenderer('update:downloaded', info);
  });

  autoUpdater.on('error', (err) => {
    log.error('AutoUpdater error:', err);
    sendToRenderer('update:error', err == null ? 'unknown error' : (err.stack || err.message));
  });

  ipcMain.handle('update:quit-and-install', () => {
    autoUpdater.quitAndInstall();
  });

  // Check on launch, then every 4 hours while the app is open.
  if (!isDev) {
    autoUpdater.checkForUpdates().catch((e) => log.error(e));
    setInterval(() => {
      autoUpdater.checkForUpdates().catch((e) => log.error(e));
    }, 4 * 60 * 60 * 1000);
  }
}

ipcMain.handle('app:get-version', () => app.getVersion());

app.whenReady().then(() => {
  createWindow();
  setupAutoUpdater();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
