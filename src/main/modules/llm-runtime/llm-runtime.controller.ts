import type { IpcMain } from 'electron';
import {
    cancelPull,
    checkLlmStatus,
    getLlmConfig,
    pullModel,
    setLlmConfig,
    startOllama,
} from './index';

export function registerLlmRuntimeIpc(ipcMain: IpcMain): void {
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
}
