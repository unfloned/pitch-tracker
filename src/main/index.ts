import { app, BrowserWindow, Menu, nativeImage, Tray } from 'electron';
import { join } from 'node:path';
import { initDatabase } from './db';
import { registerIpcHandlers } from './ipc';
import { initAutoUpdater } from './updater';
import { initAgentsDatabase, startAgentScheduler } from './agents';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

function createWindow(): void {
    if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
        return;
    }

    mainWindow = new BrowserWindow({
        width: 1280,
        height: 820,
        minWidth: 900,
        minHeight: 600,
        title: 'Simple Application Tracker',
        backgroundColor: '#0f0f12',
        titleBarStyle: 'hiddenInset',
        show: false,
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false,
        },
    });

    mainWindow.on('ready-to-show', () => mainWindow?.show());
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    if (process.env.ELECTRON_RENDERER_URL) {
        mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
    } else {
        mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
    }
}

function openNewEntry(): void {
    createWindow();
    mainWindow?.webContents.send('navigate', 'new');
}

function createTray(): void {
    const iconPath = join(__dirname, '../../resources/tray-icon.png');
    const image = nativeImage.createFromPath(iconPath);
    if (image.isEmpty()) {
        console.warn('[tray] Icon nicht gefunden unter', iconPath, '— überspringe Tray.');
        return;
    }
    image.setTemplateImage(true);
    tray = new Tray(image);
    tray.setToolTip('Simple Application Tracker');

    const menu = Menu.buildFromTemplate([
        { label: 'Neuer Eintrag', click: openNewEntry },
        { label: 'Alle Bewerbungen', click: () => createWindow() },
        { type: 'separator' },
        { label: 'Beenden', role: 'quit' },
    ]);
    tray.setContextMenu(menu);
    tray.on('click', () => createWindow());
}

app.whenReady().then(() => {
    initDatabase();
    initAgentsDatabase();
    registerIpcHandlers(() => mainWindow);
    createWindow();
    createTray();
    initAutoUpdater(() => mainWindow);
    startAgentScheduler(() => mainWindow);

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    // Bleibt im Tray offen — kein Quit bei Window-Close
});
