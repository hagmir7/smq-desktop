import { BrowserWindow, app } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === 'development';

let mainWindowReference = null;
let childWindow = null;

export const setMainWindow = (window) => {
    mainWindowReference = window;
};

export const createShowWindow = (data) => {
    if (childWindow) return childWindow;

    childWindow = new BrowserWindow({
        width: data.width ?? 1200,
        height: data.height ?? 700,
        resizable: data.resizable ?? false,
        icon: path.join(__dirname, '..', 'inter.png'),

        parent: mainWindowReference,
        modal: true,
        // minimizable: false,
        alwaysOnTop: true,
        webPreferences: {
           preload: path.join(__dirname, '..', 'preload.js'),
        }
    });



    if (isDev) {
        childWindow.loadURL(`http://localhost:5173/${data.url}`);
    } else {
        childWindow.loadFile(path.join(app.getAppPath(), 'react-dist', 'index.html'), {
            hash: data.url
        });
        childWindow.setMenu(null);
    }

    childWindow.on('closed', () => {
        childWindow = null;
    });

    return childWindow;
};
