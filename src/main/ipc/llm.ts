import type { IpcMain } from 'electron';
import type { ApplicationInput } from '@shared/application';
import { getApplication } from '../db';
import {
    assessFit,
    cancelPull,
    checkLlmStatus,
    draftEmail,
    extractJobData,
    getLlmConfig,
    pullModel,
    setLlmConfig,
    startOllama,
} from '../llm';

export function registerLlmIpc(ipcMain: IpcMain): void {
    ipcMain.handle('llm:extract', async (_evt, url: string) => extractJobData(url));
    ipcMain.handle('llm:assessFit', async (_evt, input: ApplicationInput) => assessFit(input));
    ipcMain.handle('llm:getConfig', async () => getLlmConfig());
    ipcMain.handle('llm:setConfig', async (_evt, config) => {
        setLlmConfig(config);
        return getLlmConfig();
    });
    ipcMain.handle('llm:status', async () => checkLlmStatus());
    ipcMain.handle('llm:start', async () => startOllama());
    ipcMain.handle('llm:pullModel', async (evt, modelName: string) =>
        pullModel(modelName, (p) => {
            // Renderer subscribes via window.api.on('llm:pullProgress', cb).
            // Guard against the window being closed mid-pull.
            if (!evt.sender.isDestroyed()) {
                evt.sender.send('llm:pullProgress', p);
            }
        }),
    );
    ipcMain.handle('llm:cancelPull', async (_evt, modelName: string) => ({
        canceled: cancelPull(modelName),
    }));
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
