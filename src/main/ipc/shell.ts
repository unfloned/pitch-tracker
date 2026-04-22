import type { IpcMain } from 'electron';
import { shell } from 'electron';

export function registerShellIpc(ipcMain: IpcMain): void {
    ipcMain.handle('shell:openExternal', async (_evt, url: string) => {
        await shell.openExternal(url);
        return { ok: true };
    });
}
