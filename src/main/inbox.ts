import type { BrowserWindow } from 'electron';
import { classifyInboundEmail } from './email-classifier';
import { fetchRecentUnread } from './imap';
import { createEventSender } from './ipc/events';
import {
    getInboundEmailByMessageId,
    getLatestInboundReceivedAt,
    insertInboundEmail,
    listApplications,
    setInboundReviewStatus,
    updateApplication,
    updateInboundSuggestion,
    type InboundReviewStatus,
} from './db';
import { getUserProfile } from './profile';
import type { ApplicationStatus } from '@shared/application';
import { serializeApplication } from './ipc/serializers';
import type { ApplicationRecord } from '../preload/index';

export interface SyncResult {
    fetched: number;
    stored: number;
    classified: number;
    autoApplied: number;
    dropped: number;
    skippedDuplicates: number;
    error?: string;
}

const AUTO_APPLY_CONFIDENCE = 80;

/**
 * Fetch → dedupe by messageId → classify with local LLM. Mails without a
 * matched application are dropped silently. Mails with a clear status and
 * confidence >= 80 are auto-applied (status + note prepended). The rest is
 * stored as pending for in-drawer review.
 */
export async function syncInbox(): Promise<SyncResult> {
    const result: SyncResult = {
        fetched: 0,
        stored: 0,
        classified: 0,
        autoApplied: 0,
        dropped: 0,
        skippedDuplicates: 0,
    };
    try {
        // Only look back as far as our newest known record, with a 7-day
        // overlap to catch anything that slipped in since. First run falls
        // back to the 30-day default inside fetchRecentUnread.
        const latest = getLatestInboundReceivedAt();
        const since = latest
            ? new Date(new Date(latest).getTime() - 7 * 24 * 60 * 60 * 1000)
            : undefined;

        const messages = await fetchRecentUnread(since);
        result.fetched = messages.length;

        const apps = listApplications();

        for (const msg of messages) {
            if (getInboundEmailByMessageId(msg.messageId)) {
                result.skippedDuplicates += 1;
                continue;
            }
            const classification = await classifyInboundEmail(
                {
                    subject: msg.subject,
                    fromAddress: msg.fromAddress,
                    fromName: msg.fromName,
                    bodyText: msg.bodyText,
                },
                apps,
            );

            if (!classification.applicationId) {
                result.dropped += 1;
                continue;
            }

            const inserted = insertInboundEmail({
                messageId: msg.messageId,
                fromAddress: msg.fromAddress,
                fromName: msg.fromName,
                subject: msg.subject,
                bodyText: msg.bodyText,
                receivedAt: msg.receivedAt,
                suggestedApplicationId: classification.applicationId,
                suggestedStatus: classification.status,
                suggestedNote: classification.note,
                confidence: classification.confidence,
            });

            if (!inserted) {
                result.skippedDuplicates += 1;
                continue;
            }
            result.stored += 1;

            const status = classification.status;
            if (status === null || status === 'other') {
                continue;
            }
            if (classification.confidence >= AUTO_APPLY_CONFIDENCE) {
                applySuggestion(
                    inserted.id,
                    classification.applicationId,
                    status,
                    classification.note,
                );
                result.autoApplied += 1;
            } else {
                result.classified += 1;
            }
        }
    } catch (err) {
        result.error = (err as Error).message;
    }
    return result;
}

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
        const prefix =
            note && note.trim().length > 0
                ? `[${new Date().toISOString().slice(0, 10)}] ${note.trim()}\n\n`
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

const AUTO_SYNC_INTERVAL_MS = 5 * 60 * 1000;
const AUTO_SYNC_INITIAL_DELAY_MS = 30 * 1000;

/**
 * Polls the configured IMAP inbox in the background. Skips when IMAP is not
 * configured. Pushes `inbox:autoSynced` to the renderer on every successful
 * tick so the dashboard can refresh and toast on autoApplied > 0.
 */
export function startInboxAutoSync(getWindow: () => BrowserWindow | null): void {
    const send = createEventSender(getWindow);
    const tick = async () => {
        const p = getUserProfile();
        if (!p.imapHost || !p.imapUser || !p.imapPassword) return;
        try {
            const result = await syncInbox();
            send('inbox:autoSynced', result);
        } catch {
            // next tick will retry
        }
    };
    setTimeout(tick, AUTO_SYNC_INITIAL_DELAY_MS);
    setInterval(tick, AUTO_SYNC_INTERVAL_MS);
}
