import { app, BrowserWindow, dialog, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import pkg from "electron-updater";

const { autoUpdater } = pkg;

const isDev = process.env.NODE_ENV === "development";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

export default function createLoginWindow() {
    let loginWindow = new BrowserWindow({
        width: 600,
        height: 600,
        frame: false,
        icon: path.join(__dirname, "..", "inter.png"),
        resizable: false,
        webPreferences: {
            preload: path.join(__dirname, "..", "preload.js"),
            contextIsolation: true,
        },
    });

    if (isDev) {
        loginWindow.loadURL("http://localhost:5173/login");
    } else {
        loginWindow.setMenu(null);

        const indexPath = path.join(app.getAppPath(), "react-dist", "index.html");

        loginWindow.loadURL(`file://${indexPath}/login`);

        if (process.platform === "win32" || process.env.APPIMAGE) {
            autoUpdater.checkForUpdatesAndNotify();
        }
    }

    loginWindow.on("maximize", () => {
        if (!loginWindow.isDestroyed()) {
            loginWindow.unmaximize();
        }
    });

    // Resolve the target window from the IPC event itself rather than
    // closing over `loginWindow`. This avoids acting on a stale/destroyed
    // window reference if these handlers ever end up registered more than
    // once (e.g. createLoginWindow() called again after logout).
    const minimizeHandler = (event) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        if (win && !win.isDestroyed()) {
            win.minimize();
        }
    };

    const maximizeHandler = (event) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        if (!win || win.isDestroyed()) return;
        if (win.isMaximized()) {
            win.unmaximize();
        } else {
            win.maximize();
        }
    };

    const closeHandler = (event) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        if (win && !win.isDestroyed()) {
            win.close();
        }
    };

    ipcMain.on("window-minimize", minimizeHandler);
    ipcMain.on("window-maximize", maximizeHandler);
    ipcMain.on("window-close", closeHandler);

    loginWindow.on("maximize", () => {
        if (!loginWindow.isDestroyed()) {
            loginWindow.webContents.send("window-maximized", true);
        }
    });

    loginWindow.on("unmaximize", () => {
        if (!loginWindow.isDestroyed()) {
            loginWindow.webContents.send("window-maximized", false);
        }
    });

    // Critical: remove these listeners when the window closes so they don't
    // stack up (and fire against a destroyed window) if a new login window
    // is created later in the same app session.
    loginWindow.on("closed", () => {
        ipcMain.removeListener("window-minimize", minimizeHandler);
        ipcMain.removeListener("window-maximize", maximizeHandler);
        ipcMain.removeListener("window-close", closeHandler);
        loginWindow = null;
    });

    return loginWindow;
}

autoUpdater.on("update-available", (info) => {
    dialog.showMessageBox({
        type: "info",
        title: "Mise à jour disponible",
        message: `Une nouvelle mise à jour est disponible.\nVersion actuelle : ${app.getVersion()}`,
        detail: `La version ${info.version} est en cours de téléchargement...`,
    });

    autoUpdater.downloadUpdate();
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});

autoUpdater.on("error", (error) => {
    dialog.showErrorBox(
        "Update Error",
        error == null ? "unknown" : error.stack || error.toString()
    );
});