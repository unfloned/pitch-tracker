import type { IpcMain } from 'electron';
import { app, dialog } from 'electron';
import { copyFileSync, mkdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import {
    getUserProfile,
    isSmtpEncryptionAvailable,
    setUserProfile,
    type UserProfile,
} from '../profile';

export function registerProfileIpc(ipcMain: IpcMain): void {
    ipcMain.handle('profile:get', () => getUserProfile());
    ipcMain.handle('profile:set', (_evt, patch: Partial<UserProfile>) => setUserProfile(patch));
    ipcMain.handle('profile:encryptionAvailable', () => isSmtpEncryptionAvailable());

    ipcMain.handle('profile:pickCv', async () => {
        const result = await dialog.showOpenDialog({
            title: 'Pick CV file',
            properties: ['openFile'],
            filters: [
                { name: 'Documents', extensions: ['pdf', 'doc', 'docx', 'odt', 'rtf', 'txt'] },
                { name: 'All files', extensions: ['*'] },
            ],
        });
        if (result.canceled || result.filePaths.length === 0) return { canceled: true };

        const source = result.filePaths[0];
        try {
            const cvDir = join(app.getPath('userData'), 'cv');
            mkdirSync(cvDir, { recursive: true });
            const ext = extname(source) || '.pdf';
            const stored = join(cvDir, 'cv' + ext);
            copyFileSync(source, stored);
            setUserProfile({ cvPath: stored });
            return { canceled: false, path: stored };
        } catch (err) {
            return { canceled: false, error: (err as Error).message };
        }
    });
}
