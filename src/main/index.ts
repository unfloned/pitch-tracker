import { app, BrowserWindow, clipboard, globalShortcut, Menu, nativeImage, Tray } from 'electron';
import { join } from 'node:path';
import { initDatabase } from './db';
import { registerIpcHandlers } from './ipc';
import { initAutoUpdater } from './updater';
import { initAgentsDatabase, listCandidates, startAgentScheduler } from './agents';
import { startFollowUpReminder } from './reminders';

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
        title: 'Pitch Tracker',
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

function openQuickAddFromClipboard(): void {
    const clip = clipboard.readText()?.trim() ?? '';
    const url = /^https?:\/\//i.test(clip) ? clip : '';
    createWindow();
    mainWindow?.show();
    mainWindow?.focus();
    mainWindow?.webContents.send('navigate:quickAdd', { url });
}

function refreshTrayMenu(): void {
    if (!tray) return;
    const candidates = safeListCandidates().slice(0, 5);
    const candidateItems: Electron.MenuItemConstructorOptions[] = candidates.length
        ? candidates.map((c) => ({
              label: `${c.score >= 50 ? '★ ' : ''}${(c.title || 'Untitled').slice(0, 60)}${c.company ? ' - ' + c.company.slice(0, 30) : ''}`,
              click: () => {
                  if (c.sourceUrl) {
                      import('electron').then(({ shell }) => shell.openExternal(c.sourceUrl));
                  }
              },
          }))
        : [{ label: 'No candidates yet', enabled: false }];

    const menu = Menu.buildFromTemplate([
        { label: 'New entry', accelerator: 'CommandOrControl+N', click: openNewEntry },
        {
            label: 'Quick add from clipboard',
            accelerator: 'CommandOrControl+Shift+N',
            click: openQuickAddFromClipboard,
        },
        { label: 'Open tracker', click: () => createWindow() },
        { type: 'separator' },
        { label: 'Latest candidates', submenu: candidateItems },
        { type: 'separator' },
        { label: 'Quit', role: 'quit' },
    ]);
    tray.setContextMenu(menu);
}

function safeListCandidates() {
    try {
        return listCandidates(0);
    } catch {
        return [];
    }
}

function createTray(): void {
    const iconPath = join(__dirname, '../../resources/tray-icon.png');
    const image = nativeImage.createFromPath(iconPath);
    if (image.isEmpty()) {
        console.warn('[tray] Icon not found at', iconPath, '- skipping tray.');
        return;
    }
    image.setTemplateImage(true);
    tray = new Tray(image);
    tray.setToolTip('Pitch Tracker');
    refreshTrayMenu();
    tray.on('click', () => createWindow());
    setInterval(refreshTrayMenu, 60 * 1000);
}

app.whenReady().then(() => {
    initDatabase();
    initAgentsDatabase();
    registerIpcHandlers(() => mainWindow);
    createWindow();
    createTray();
    initAutoUpdater(() => mainWindow);
    startAgentScheduler(() => mainWindow);
    startFollowUpReminder(() => mainWindow);

    globalShortcut.register('CommandOrControl+Shift+N', openQuickAddFromClipboard);

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
    // Bleibt im Tray offen — kein Quit bei Window-Close
});
