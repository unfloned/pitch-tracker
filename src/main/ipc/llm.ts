import type { IpcMain } from 'electron';
import type { ApplicationInput } from '@shared/application';
import { getApplication } from '../db';
import {
    assessFit,
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
    ipcMain.handle('llm:pullModel', async (_evt, modelName: string) => pullModel(modelName));
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
