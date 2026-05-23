import { app, BrowserWindow, ipcMain } from 'electron';
import { initDatabase } from '../db';
import { registerAgentsIpc } from '../modules/agents/agents.controller';
import { initAgentsDatabase, startAgentScheduler } from '../modules/agents';
import { registerApplicationsIpc } from '../modules/applications/applications.controller';
import { registerBackupIpc } from '../modules/backup/backup.controller';
import { registerChatIpc } from '../modules/chat/chat.controller';
import { registerExportIpc } from '../modules/export/export.controller';
import { registerInboxIpc } from '../modules/inbox/inbox.controller';
import { startInboxIdleWatcher } from '../modules/inbox';
import { registerLlmRuntimeIpc } from '../modules/llm-runtime/llm-runtime.controller';
import { registerMailIpc } from '../modules/mail/mail.controller';
import { registerProfileIpc } from '../modules/profile/profile.controller';
import { startFollowUpReminder } from '../modules/reminders/reminders.service';
import { registerShellIpc } from '../modules/shell/shell.controller';
import { initAutoUpdater } from '../modules/updater/updater.service';
import { createWindow, getMainWindow } from './window';
import { createTray } from './tray';
import { registerGlobalShortcuts, unregisterGlobalShortcuts } from './shortcuts';

function registerIpcHandlers(getWindow: () => BrowserWindow | null): void {
    registerApplicationsIpc(ipcMain);
    registerLlmRuntimeIpc(ipcMain);
    registerAgentsIpc(ipcMain, getWindow);
    registerMailIpc(ipcMain);
    registerProfileIpc(ipcMain);
    registerBackupIpc(ipcMain);
    registerChatIpc(ipcMain, getWindow);
    registerShellIpc(ipcMain);
    registerExportIpc(ipcMain);
    registerInboxIpc(ipcMain, getWindow);
}

app.whenReady().then(() => {
    initDatabase();
    initAgentsDatabase();
    registerIpcHandlers(getMainWindow);
    createWindow();
    createTray();
    initAutoUpdater(getMainWindow);
    startAgentScheduler(getMainWindow);
    startInboxIdleWatcher(getMainWindow);
    startFollowUpReminder(getMainWindow);

    registerGlobalShortcuts();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('will-quit', () => {
    unregisterGlobalShortcuts();
});

app.on('window-all-closed', () => {
    // Bleibt im Tray offen - kein Quit bei Window-Close
});
