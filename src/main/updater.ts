import { app, BrowserWindow, ipcMain } from 'electron';
import pkg from 'electron-updater';
import { createEventSender } from './ipc/events';

const { autoUpdater } = pkg;

export function initAutoUpdater(getWindow: () => BrowserWindow | null): void {
    const send = createEventSender(getWindow);
    ipcMain.handle('updater:currentVersion', async () => ({ version: app.getVersion() }));

    ipcMain.handle('updater:checkNow', async () => {
        if (!app.isPackaged) {
            return { dev: true, currentVersion: app.getVersion() };
        }
        const result = await autoUpdater.checkForUpdates();
        return {
            dev: false,
            currentVersion: app.getVersion(),
            updateAvailable: Boolean(
                result?.updateInfo && result.updateInfo.version !== app.getVersion(),
            ),
            remoteVersion: result?.updateInfo?.version,
        };
    });

    ipcMain.handle('updater:installNow', async () => {
        if (!app.isPackaged) return { ok: false, dev: true };
        autoUpdater.quitAndInstall();
        return { ok: true };
    });

    if (!app.isPackaged) return;

    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.on('update-available', (info) => {
        send('updater:available', {
            version: info.version,
            releaseDate: info.releaseDate,
            notes: typeof info.releaseNotes === 'string' ? info.releaseNotes : '',
        });
    });

    autoUpdater.on('update-downloaded', (info) => {
        send('updater:downloaded', { version: info.version });
    });

    autoUpdater.on('error', (err) => {
        send('updater:error', { message: err.message });
    });

    autoUpdater.checkForUpdates().catch(() => { });

    setInterval(
        () => {
            autoUpdater.checkForUpdates().catch(() => { });
        },
        4 * 60 * 60 * 1000,
    );
}
