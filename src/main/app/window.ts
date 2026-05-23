import { app, BrowserWindow, clipboard, nativeImage } from 'electron';
import { join } from 'node:path';
import type { RendererEventMap } from '@shared/events';

let mainWindow: BrowserWindow | null = null;

export function getMainWindow(): BrowserWindow | null {
    return mainWindow;
}

export function createWindow(): void {
    if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
        return;
    }

    const iconPath = join(__dirname, '../../resources/icon.png');

    mainWindow = new BrowserWindow({
        width: 1280,
        height: 820,
        minWidth: 900,
        minHeight: 600,
        title: 'Pitch Tracker',
        backgroundColor: '#f4efe6',
        titleBarStyle: 'hiddenInset',
        icon: iconPath,
        show: false,
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false,
        },
    });

    // macOS dev mode: set the Dock icon explicitly. In packaged builds the
    // Info.plist/bundle icon handles this; in `electron-vite dev` there is no
    // bundle so the default Electron icon shows unless we override.
    if (process.platform === 'darwin' && process.env.ELECTRON_RENDERER_URL && app.dock) {
        const dockImage = nativeImage.createFromPath(iconPath);
        if (!dockImage.isEmpty()) app.dock.setIcon(dockImage);
    }

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

function sendToMain<K extends keyof RendererEventMap>(
    channel: K,
    payload: RendererEventMap[K],
): void {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(channel, payload);
    }
}

export function openNewEntry(): void {
    createWindow();
    sendToMain('navigate', 'new');
}

export function openQuickAddFromClipboard(): void {
    const clip = clipboard.readText()?.trim() ?? '';
    const url = /^https?:\/\//i.test(clip) ? clip : '';
    createWindow();
    mainWindow?.show();
    mainWindow?.focus();
    sendToMain('navigate:quickAdd', { url });
}
