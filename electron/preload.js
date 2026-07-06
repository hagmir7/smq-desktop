const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('appInfo', {
  getVersion: () => ipcRenderer.invoke('app:get-version')
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
