import { contextBridge, ipcRenderer } from 'electron';
import type {
    ApplicationInput,
    ApplicationStatus,
    ExtractedJobData,
    FitAssessment,
    Priority,
    RemoteType,
} from '@shared/application';
import type {
    AgentRunRecord,
    JobSearchInput,
    SerializedJobCandidate,
    SerializedJobSearch,
    CandidateStatus,
} from '@shared/job-search';

export interface ApplicationRecord {
    id: string;
    companyName: string;
    companyWebsite: string;
    jobTitle: string;
    jobUrl: string;
    jobDescription: string;
    location: string;
    remote: RemoteType;
    salaryMin: number;
    salaryMax: number;
    salaryCurrency: string;
    stack: string;
    status: ApplicationStatus;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    notes: string;
    tags: string;
    priority: Priority;
    requiredProfile: string[];
    benefits: string[];
    matchScore: number;
    matchReason: string;
    source: string;
    appliedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface AgentProfile {
    stackKeywords: string;
    remotePreferred: boolean;
    minSalary: number;
    antiStack: string;
    autoImportThreshold: number;
}

const api = {
    applications: {
        list: (): Promise<ApplicationRecord[]> => ipcRenderer.invoke('applications:list'),
        get: (id: string): Promise<ApplicationRecord | null> => ipcRenderer.invoke('applications:get', id),
        create: (input: ApplicationInput): Promise<ApplicationRecord> =>
            ipcRenderer.invoke('applications:create', input),
        update: (id: string, input: ApplicationInput): Promise<ApplicationRecord> =>
            ipcRenderer.invoke('applications:update', id, input),
        delete: (id: string): Promise<{ ok: true }> => ipcRenderer.invoke('applications:delete', id),
    },
    llm: {
        extract: (url: string): Promise<ExtractedJobData> => ipcRenderer.invoke('llm:extract', url),
        assessFit: (input: ApplicationInput): Promise<FitAssessment> =>
            ipcRenderer.invoke('llm:assessFit', input),
        getConfig: (): Promise<{ ollamaUrl: string; ollamaModel: string }> =>
            ipcRenderer.invoke('llm:getConfig'),
        setConfig: (config: { ollamaUrl?: string; ollamaModel?: string }) =>
            ipcRenderer.invoke('llm:setConfig', config),
        status: (): Promise<{ running: boolean; models: string[]; error?: string }> =>
            ipcRenderer.invoke('llm:status'),
        start: (): Promise<{ started: boolean; method: string; message?: string }> =>
            ipcRenderer.invoke('llm:start'),
        pullModel: (modelName: string): Promise<{ ok: boolean; message?: string }> =>
            ipcRenderer.invoke('llm:pullModel', modelName),
    },
    agents: {
        listSearches: (): Promise<SerializedJobSearch[]> => ipcRenderer.invoke('agents:listSearches'),
        createSearch: (input: JobSearchInput): Promise<SerializedJobSearch> =>
            ipcRenderer.invoke('agents:createSearch', input),
        updateSearch: (id: string, input: JobSearchInput): Promise<SerializedJobSearch> =>
            ipcRenderer.invoke('agents:updateSearch', id, input),
        deleteSearch: (id: string): Promise<{ ok: true }> =>
            ipcRenderer.invoke('agents:deleteSearch', id),
        runSearch: (id: string): Promise<{ added: number; scanned: number; errors: string[]; canceled: boolean }> =>
            ipcRenderer.invoke('agents:runSearch', id),
        cancelRun: (id: string): Promise<{ canceled: boolean }> =>
            ipcRenderer.invoke('agents:cancelRun', id),
        isRunning: (id: string): Promise<boolean> => ipcRenderer.invoke('agents:isRunning', id),
        runningSearches: (): Promise<string[]> => ipcRenderer.invoke('agents:runningSearches'),
        listCandidates: (minScore?: number): Promise<SerializedJobCandidate[]> =>
            ipcRenderer.invoke('agents:listCandidates', minScore),
        updateCandidate: (
            id: string,
            input: { status?: CandidateStatus; importedApplicationId?: string | null; favorite?: boolean },
        ): Promise<SerializedJobCandidate> => ipcRenderer.invoke('agents:updateCandidate', id, input),
        bulkUpdateCandidates: (
            ids: string[],
            input: { status?: CandidateStatus; favorite?: boolean },
        ): Promise<number> => ipcRenderer.invoke('agents:bulkUpdateCandidates', ids, input),
        importCandidate: (id: string): Promise<ApplicationRecord> =>
            ipcRenderer.invoke('agents:importCandidate', id),
        listRuns: (limit?: number): Promise<AgentRunRecord[]> =>
            ipcRenderer.invoke('agents:listRuns', limit),
        getProfile: (): Promise<AgentProfile> => ipcRenderer.invoke('agents:getProfile'),
        setProfile: (profile: Partial<AgentProfile>): Promise<AgentProfile> =>
            ipcRenderer.invoke('agents:setProfile', profile),
    },
    export: {
        excel: (
            labels: unknown,
            dialogTitle: string,
        ): Promise<{ canceled: boolean; filePath?: string; count?: number }> =>
            ipcRenderer.invoke('export:excel', labels, dialogTitle),
    },
    updater: {
        checkNow: (): Promise<{
            dev?: boolean;
            currentVersion: string;
            updateAvailable?: boolean;
            remoteVersion?: string;
        }> => ipcRenderer.invoke('updater:checkNow'),
        installNow: () => ipcRenderer.invoke('updater:installNow'),
        currentVersion: (): Promise<{ version: string }> => ipcRenderer.invoke('updater:currentVersion'),
    },
    shell: {
        openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),
    },
    on: (channel: string, handler: (...args: any[]) => void) => {
        const wrapped = (_evt: unknown, ...args: any[]) => handler(...args);
        ipcRenderer.on(channel, wrapped);
        return () => ipcRenderer.removeListener(channel, wrapped);
    },
};

contextBridge.exposeInMainWorld('api', api);

export type Api = typeof api;
