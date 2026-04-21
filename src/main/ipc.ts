import { dialog, ipcMain, shell } from 'electron';
import { join } from 'node:path';
import {
    createApplication,
    deleteApplication,
    getApplication,
    listApplications,
    updateApplication,
} from './db';
import { exportToExcel } from './export';
import {
    assessFit,
    checkLlmStatus,
    extractJobData,
    getLlmConfig,
    pullModel,
    setLlmConfig,
    startOllama,
} from './llm';
import {
    createSearch,
    deleteSearch,
    getAgentProfile,
    listCandidates,
    listSearches,
    runSearchNow,
    setAgentProfile,
    updateCandidate,
    updateSearch,
} from './agents';
import type { ApplicationInput } from '@shared/application';

export function registerIpcHandlers(): void {
    // Applications
    ipcMain.handle('applications:list', () => {
        return listApplications().map(serializeApplication);
    });
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

    // LLM
    ipcMain.handle('llm:extract', async (_evt, url: string) => {
        return await extractJobData(url);
    });
    ipcMain.handle('llm:assessFit', async (_evt, input: ApplicationInput) => {
        return await assessFit(input);
    });
    ipcMain.handle('llm:getConfig', async () => getLlmConfig());
    ipcMain.handle('llm:setConfig', async (_evt, config) => {
        setLlmConfig(config);
        return getLlmConfig();
    });
    ipcMain.handle('llm:status', async () => checkLlmStatus());
    ipcMain.handle('llm:start', async () => startOllama());
    ipcMain.handle('llm:pullModel', async (_evt, modelName: string) => pullModel(modelName));

    // Agents — Searches
    ipcMain.handle('agents:listSearches', () => listSearches());
    ipcMain.handle('agents:createSearch', (_evt, input) => createSearch(input));
    ipcMain.handle('agents:updateSearch', (_evt, id: string, input) => updateSearch(id, input));
    ipcMain.handle('agents:deleteSearch', (_evt, id: string) => {
        deleteSearch(id);
        return { ok: true };
    });
    ipcMain.handle('agents:runSearch', async (_evt, id: string) => await runSearchNow(id));

    // Agents — Candidates
    ipcMain.handle('agents:listCandidates', (_evt, minScore?: number) =>
        listCandidates(minScore ?? 0),
    );
    ipcMain.handle('agents:updateCandidate', (_evt, id: string, input) =>
        updateCandidate(id, input),
    );
    ipcMain.handle('agents:importCandidate', (_evt, candidateId: string) => {
        const candidates = listCandidates();
        const cand = candidates.find((c) => c.id === candidateId);
        if (!cand) throw new Error(`Candidate ${candidateId} not found`);
        const newApp = createApplication({
            companyName: cand.company,
            jobTitle: cand.title,
            jobUrl: cand.sourceUrl,
            jobDescription: cand.summary,
            location: cand.location,
            source: cand.sourceUrl.includes('germantechjobs') ? 'germantechjobs' : 'join',
            notes: `Aus Agent-Vorschlag übernommen. LLM-Score: ${cand.score}/100 — ${cand.scoreReason}`,
            matchScore: cand.score,
            matchReason: cand.scoreReason,
        });
        updateCandidate(candidateId, { status: 'imported', importedApplicationId: newApp.id });
        return serializeApplication(newApp);
    });

    // Agents — Profile
    ipcMain.handle('agents:getProfile', () => getAgentProfile());
    ipcMain.handle('agents:setProfile', (_evt, profile) => setAgentProfile(profile));

    // Export
    ipcMain.handle('export:excel', async () => {
        const result = await dialog.showSaveDialog({
            title: 'Bewerbungen als Excel exportieren',
            defaultPath: join(
                'Simple-Application-Tracker_' + new Date().toISOString().slice(0, 10) + '.xlsx',
            ),
            filters: [{ name: 'Excel', extensions: ['xlsx'] }],
        });
        if (result.canceled || !result.filePath) return { canceled: true };
        const count = await exportToExcel(result.filePath);
        return { canceled: false, filePath: result.filePath, count };
    });

    // Shell
    ipcMain.handle('shell:openExternal', async (_evt, url: string) => {
        await shell.openExternal(url);
        return { ok: true };
    });
}

function serializeApplication(row: any) {
    return {
        ...row,
        appliedAt: row.appliedAt ? row.appliedAt.toISOString() : null,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
    };
}

function parseDate(value: unknown): Date | null | undefined {
    if (value === undefined) return undefined;
    if (value === null) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'string') return value ? new Date(value) : null;
    return null;
}
