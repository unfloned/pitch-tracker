import type { IpcMain } from 'electron';
import { getApplication, listEmailsForApplication } from '../../db';
import { draftEmail, sendEmail, verifySmtp, type EmailSendRequest } from './index';

export function registerMailIpc(ipcMain: IpcMain): void {
    ipcMain.handle('email:verify', () => verifySmtp());
    ipcMain.handle('email:send', (_evt, req: EmailSendRequest) => sendEmail(req));
    ipcMain.handle('email:listForApp', (_evt, applicationId: string) =>
        listEmailsForApplication(applicationId).map((r) => ({
            ...r,
            sentAt: r.sentAt.toISOString(),
        })),
    );
    ipcMain.handle('llm:draftEmail', async (_evt, applicationId: string) => {
        const app = getApplication(applicationId);
        if (!app) throw new Error(`Application ${applicationId} not found`);
        return draftEmail({
            companyName: app.companyName,
            jobTitle: app.jobTitle,
            jobDescription: app.jobDescription,
            location: app.location,
            remote: app.remote,
            stack: app.stack,
            contactName: app.contactName,
        });
    });
}
