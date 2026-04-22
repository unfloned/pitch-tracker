import type { IpcMain } from 'electron';
import { dialog } from 'electron';
import { createBackup, restoreBackup } from '../backup';

export function registerBackupIpc(ipcMain: IpcMain): void {
    ipcMain.handle('backup:create', async () => {
        const defaultName = 'tracker-backup_' + new Date().toISOString().slice(0, 10) + '.zip';
        const result = await dialog.showSaveDialog({
            title: 'Export backup',
            defaultPath: defaultName,
            filters: [{ name: 'ZIP archive', extensions: ['zip'] }],
        });
        if (result.canceled || !result.filePath) return { ok: false, canceled: true };
        return createBackup(result.filePath);
    });

    ipcMain.handle('backup:restore', async () => {
        const result = await dialog.showOpenDialog({
            title: 'Restore backup',
            properties: ['openFile'],
            filters: [{ name: 'ZIP archive', extensions: ['zip'] }],
        });
        if (result.canceled || result.filePaths.length === 0) {
            return { ok: false, canceled: true };
        }
        return restoreBackup(result.filePaths[0]);
    });
}
