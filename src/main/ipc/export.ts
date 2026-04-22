import type { IpcMain } from 'electron';
import { dialog } from 'electron';
import { join } from 'node:path';
import { exportToExcel, type ExportLabels } from '../export';

export function registerExportIpc(ipcMain: IpcMain): void {
    ipcMain.handle('export:excel', async (_evt, labels: ExportLabels, dialogTitle: string) => {
        const result = await dialog.showSaveDialog({
            title: dialogTitle,
            defaultPath: join(
                'Pitch-Tracker_' + new Date().toISOString().slice(0, 10) + '.xlsx',
            ),
            filters: [{ name: 'Excel', extensions: ['xlsx'] }],
        });
        if (result.canceled || !result.filePath) return { canceled: true };
        const count = await exportToExcel(result.filePath, labels);
        return { canceled: false, filePath: result.filePath, count };
    });
}
