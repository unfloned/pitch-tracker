/**
 * Typed map of all main->renderer events. Both sides import from here so a
 * channel can't be sent with a different shape than the renderer expects.
 *
 * Add a new channel:
 *   1. Add the entry below with its payload type.
 *   2. Use it in main via the typed sendEvent helper.
 *   3. Subscribe in the renderer via window.api.on('channel', payload => ...).
 *      The handler's payload is now strictly typed.
 */

import type { JobSource } from './job-search';

export type RunPhase = 'fetching' | 'scoring' | 'done';

export interface AgentsRunStartedPayload {
    searchId: string;
    runId: string;
    sources: JobSource[];
}

export interface AgentsRunProgressPayload {
    searchId: string;
    source: string;
    current: number;
    total: number;
    phase: RunPhase;
}

export interface AgentsRunFinishedPayload {
    searchId: string;
    runId: string;
    scanned: number;
    added: number;
    errors: string[];
    canceled: boolean;
}

export interface AgentsCandidateAddedPayload {
    searchId: string;
}

export interface AgentsAutoImportedPayload {
    candidate: string;
    score: number;
}

export interface NavigateQuickAddPayload {
    url: string;
}

export interface RemindersFollowUpPayload {
    applicationId: string;
    companyName: string;
    daysSinceApplied: number;
}

export interface UpdaterAvailablePayload {
    version: string;
    releaseDate?: string;
    notes?: string;
}

export interface UpdaterDownloadedPayload {
    version: string;
}

export interface UpdaterErrorPayload {
    message: string;
}

export interface ChatToolCallPayload {
    name: string;
    args: unknown;
}

export interface LlmPullProgressPayload {
    model: string;
    status: string;
    completed: number;
    total: number;
    percent: number;
    done: boolean;
}

export interface InboxAutoSyncedPayload {
    fetched: number;
    stored: number;
    classified: number;
    autoApplied: number;
    dropped: number;
    skippedDuplicates: number;
    error?: string;
}

/**
 * The single source of truth for renderer event channel payloads.
 * `keyof` this is the channel name; `RendererEventMap[K]` is the payload.
 */
export interface RendererEventMap {
    'agents:runStarted': AgentsRunStartedPayload;
    'agents:runProgress': AgentsRunProgressPayload;
    'agents:runFinished': AgentsRunFinishedPayload;
    'agents:candidateAdded': AgentsCandidateAddedPayload;
    'agents:autoImported': AgentsAutoImportedPayload;
    'inbox:autoSynced': InboxAutoSyncedPayload;
    'llm:pullProgress': LlmPullProgressPayload;
    'navigate': string;
    'navigate:quickAdd': NavigateQuickAddPayload;
    'navigate:openApplication': string;
    'reminders:followUp': RemindersFollowUpPayload;
    'updater:available': UpdaterAvailablePayload;
    'updater:downloaded': UpdaterDownloadedPayload;
    'updater:error': UpdaterErrorPayload;
    'chat:toolCall': ChatToolCallPayload;
}

export type RendererEventChannel = keyof RendererEventMap;
