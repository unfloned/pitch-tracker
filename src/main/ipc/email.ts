import type { IpcMain } from 'electron';
import { listEmailsForApplication } from '../db';
import { sendEmail, verifySmtp, type EmailSendRequest } from '../email';

export function registerEmailIpc(ipcMain: IpcMain): void {
    ipcMain.handle('email:verify', () => verifySmtp());
    ipcMain.handle('email:send', (_evt, req: EmailSendRequest) => sendEmail(req));
    ipcMain.handle('email:listForApp', (_evt, applicationId: string) =>
        listEmailsForApplication(applicationId).map((r) => ({
            ...r,
            sentAt: r.sentAt.toISOString(),
        })),
    );
}
