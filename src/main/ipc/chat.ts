import type { BrowserWindow, IpcMain } from 'electron';
import { runChat, type ChatRequest } from '../chat';

export function registerChatIpc(
    ipcMain: IpcMain,
    getWindow: () => BrowserWindow | null,
): void {
    ipcMain.handle('chat:send', (_evt, req: ChatRequest) => runChat(req, getWindow()));
}
