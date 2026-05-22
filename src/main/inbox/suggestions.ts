import { escapeHtml } from '@shared/sanitize-html';
import type { ApplicationStatus } from '@shared/application';
import {
    listApplications,
    setInboundReviewStatus,
    updateApplication,
    updateInboundSuggestion,
    type InboundReviewStatus,
} from '../db';
import { serializeApplication } from '../ipc/serializers';
import type { ApplicationRecord } from '../../preload/index';

export interface ApplySuggestionResult {
    ok: boolean;
    application?: ApplicationRecord;
    error?: string;
}

/**
 * Accept a suggestion: apply the status change to the linked application and
 * prepend the LLM note to the application's notes, then mark the inbound
 * email as 'applied'. No-op if the suggestion has no status/application.
 */
export function applySuggestion(
    inboundId: string,
    applicationId: string,
    status: ApplicationStatus,
    note: string,
): ApplySuggestionResult {
    try {
        const apps = listApplications();
        const app = apps.find((a) => a.id === applicationId);
        if (!app) {
            return { ok: false, error: `Application ${applicationId} not found` };
        }
        // Notes are rendered via dangerouslySetInnerHTML downstream. The note
        // string here came from an LLM (untrusted), so escape every HTML
        // character before splicing it into the notes field as a paragraph.
        const prefix =
            note && note.trim().length > 0
                ? `<p>[${new Date().toISOString().slice(0, 10)}] ${escapeHtml(note.trim())}</p>\n`
                : '';
        const mergedNotes = prefix + (app.notes ?? '');
        const updated = updateApplication(applicationId, {
            status,
            notes: mergedNotes,
        });
        setInboundReviewStatus(inboundId, 'applied');
        return { ok: true, application: serializeApplication(updated) };
    } catch (err) {
        return { ok: false, error: (err as Error).message };
    }
}

export function dismissSuggestion(inboundId: string): void {
    setInboundReviewStatus(inboundId, 'dismissed');
}

export function reassignSuggestion(
    inboundId: string,
    applicationId: string | null,
    status: ApplicationStatus | 'other' | null,
): void {
    updateInboundSuggestion(inboundId, applicationId, status);
}

export function setReviewStatus(
    inboundId: string,
    status: InboundReviewStatus,
): void {
    setInboundReviewStatus(inboundId, status);
}
