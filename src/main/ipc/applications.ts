import type { IpcMain } from 'electron';
import type { ApplicationInput } from '@shared/application';
import {
    createApplication,
    deleteApplication,
    getApplication,
    listApplications,
    listApplicationEvents,
    listEventsForApplication,
    updateApplication,
} from '../db';
import { parseDate, serializeApplication, serializeEvent } from './serializers';

export function registerApplicationsIpc(ipcMain: IpcMain): void {
    ipcMain.handle('applications:list', () =>
        listApplications().map(serializeApplication),
    );

    ipcMain.handle('applications:get', (_evt, id: string) => {
        const row = getApplication(id);
        return row ? serializeApplication(row) : null;
    });

    ipcMain.handle('applications:create', (_evt, input: ApplicationInput) => {
        const parsed = { ...input, appliedAt: parseDate(input.appliedAt) };
        return serializeApplication(createApplication(parsed));
    });

    ipcMain.handle('applications:update', (_evt, id: string, input: ApplicationInput) => {
        const parsed = { ...input, appliedAt: parseDate(input.appliedAt) };
        return serializeApplication(updateApplication(id, parsed));
    });

    ipcMain.handle('applications:delete', (_evt, id: string) => {
        deleteApplication(id);
        return { ok: true };
    });

    ipcMain.handle('applications:events:list', () =>
        listApplicationEvents().map(serializeEvent),
    );

    ipcMain.handle('applications:events:forApp', (_evt, id: string) =>
        listEventsForApplication(id).map(serializeEvent),
    );
}
