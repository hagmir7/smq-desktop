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
        loginWindow.loadFile(
            path.join(app.getAppPath(), "react-dist", "index.html"),
            {
                hash: "/login",
            }
        );

        if (process.platform === "win32" || process.env.APPIMAGE) {
            autoUpdater.checkForUpdatesAndNotify();
        }
    }

    loginWindow.on("maximize", () => {
        loginWindow.unmaximize();
    });

    ipcMain.on("window-minimize", () => loginWindow.minimize());

    ipcMain.on("window-maximize", () => {
        if (loginWindow.isMaximized()) {
            loginWindow.unmaximize();
        } else {
            loginWindow.maximize();
        }
    });

    ipcMain.on("window-close", () => loginWindow.close());

    loginWindow.on("maximize", () =>
        loginWindow.webContents.send("window-maximized", true)
    );

    loginWindow.on("unmaximize", () =>
        loginWindow.webContents.send("window-maximized", false)
    );

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