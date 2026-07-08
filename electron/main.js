const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');
const { default: createLoginWindow } = require('./windows/loginWindow');
const { createShowWindow } = require('./windows/showWindow');



const isDev = process.env.NODE_ENV === 'development';

log.transports.file.level = 'info';
autoUpdater.logger = log;

let mainWindow = null;
let loginWindow = null;
let showWindow;
let currentSession = null; // { access_token, user } — single source of truth for auth

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

  return mainWindow;
}

function sendToRenderer(channel, ...args) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, ...args);
  }
}

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

  if (!isDev) {
    autoUpdater.checkForUpdates().catch((e) => log.error(e));
    setInterval(() => {
      autoUpdater.checkForUpdates().catch((e) => log.error(e));
    }, 4 * 60 * 60 * 1000);
  }
}

ipcMain.handle('app:get-version', () => app.getVersion());

// --- Auth ---

ipcMain.handle('login', async (event, data) => {
  try {
    if (data?.access_token) {
      currentSession = data; // store in main process — shared source of truth

      if (loginWindow && !loginWindow.isDestroyed()) {
        loginWindow.close();
      }

      mainWindow = createWindow();
      return { success: true };
    }
    return { success: false };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('logout', async () => {
  try {
    currentSession = null;

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.close();
    }

    if (!loginWindow || loginWindow.isDestroyed()) {
      loginWindow = createLoginWindow();
    } else {
      loginWindow.show();
    }

    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: error.message };
  }
});


ipcMain.handle('get-session', () => currentSession);

app.whenReady().then(() => {
  loginWindow = createLoginWindow();
  setupAutoUpdater();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});



ipcMain.handle('user', async (event, data) => {
  try {

    if (data.access_token) {
      if (loginWindow && !loginWindow.isDestroyed()) {
        loginWindow.close();
      }

      mainWindow = createWindow();
      return true;
    }
    return null;
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
});



ipcMain.on('openShow', async (event, preload) => {
    try {
        if (showWindow && !showWindow.isDestroyed()) {
            await new Promise((resolve) => {
                showWindow.once('closed', resolve);
                showWindow.close();
            });
        }

        showWindow = createShowWindow(preload);
        showWindow.show();

        event.reply('openShow-response', { success: true });
    } catch (error) {
        console.error('openShow error:', error);
        event.reply('openShow-response', { success: false, error: error.message });
    }
});