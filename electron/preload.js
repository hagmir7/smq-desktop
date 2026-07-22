const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  login: (data) => ipcRenderer.invoke('login', data),
  logout: () => ipcRenderer.invoke('logout'),
  user: (payload) => ipcRenderer.invoke('user', payload),
  getSession: () => ipcRenderer.invoke('get-session'),
  getVersion: () => ipcRenderer.invoke('app:get-version'),
  openShow: (payload) => ipcRenderer.send('openShow', payload),

  // onUpdateAvailable: (cb) => ipcRenderer.on('update:available', (_e, info) => cb(info)),
  // onUpdateProgress: (cb) => ipcRenderer.on('update:download-progress', (_e, p) => cb(p)),
  // onUpdateDownloaded: (cb) => ipcRenderer.on('update:downloaded', (_e, info) => cb(info)),
  // onUpdateError: (cb) => ipcRenderer.on('update:error', (_e, err) => cb(err)),
  // quitAndInstall: () => ipcRenderer.invoke('update:quit-and-install'),

  windowMinimize: () => ipcRenderer.send('window-minimize'),
  windowMaximize: () => ipcRenderer.send('window-maximize'),
  windowClose: () => ipcRenderer.send('window-close'),
  onWindowMaximized: (callback) => ipcRenderer.on('window-maximized', (_event, isMaximized) => callback(isMaximized)),
});


contextBridge.exposeInMainWorld('updater', {
  onUpdateAvailable: (callback) => {
    const listener = (_event, info) => callback(info);
    ipcRenderer.on('update:available', listener);
    return () => ipcRenderer.removeListener('update:available', listener);
  },
  onDownloadProgress: (callback) => {
    const listener = (_event, progress) => callback(progress);
    ipcRenderer.on('update:download-progress', listener);
    return () => ipcRenderer.removeListener('update:download-progress', listener);
  },
  onUpdateDownloaded: (callback) => {
    const listener = (_event, info) => callback(info);
    ipcRenderer.on('update:downloaded', listener);
    return () => ipcRenderer.removeListener('update:downloaded', listener);
  },
  onUpdateError: (callback) => {
    const listener = (_event, message) => callback(message);
    ipcRenderer.on('update:error', listener);
    return () => ipcRenderer.removeListener('update:error', listener);
  },
  quitAndInstall: () => ipcRenderer.invoke('update:quit-and-install')
});
