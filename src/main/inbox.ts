import type { BrowserWindow } from 'electron';
import {
    classifyInboundEmail,
    type ClassifyContext,
    type ClassifyInput,
} from './email-classifier';
import { fetchRecentMessages, startIdleWatcher, type IdleWatcher } from './imap';
import { createEventSender, type EventSender } from './ipc/events';
import {
    findInboundByAnyMessageId,
    findSentEmailByMessageId,
    getInboundEmailByMessageId,
    getLatestInboundReceivedAt,
    insertInboundEmail,
    listApplications,
    listEmailsForApplication,
    listInboundEmailsByApplication,
    setInboundReviewStatus,
    updateApplication,
    updateInboundSuggestion,
    type InboundReviewStatus,
} from './db';
import type { ApplicationRow } from './db/types';
import type { RawInboundMessage } from './imap';
import { getUserProfile } from './profile';
import type { ApplicationStatus } from '@shared/application';
import { serializeApplication } from './ipc/serializers';
import type { ApplicationRecord } from '../preload/index';
import { escapeHtml } from '@shared/sanitize-html';

export interface SyncResult {
    fetched: number;
    stored: number;
    classified: number;
    autoApplied: number;
    /** Mails stored without an application match - need manual review. */
    dropped: number;
    skippedDuplicates: number;
    /** Mails matched purely via RFC822 thread headers, no LLM round-trip. */
    threadMatched: number;
    error?: string;
}

const AUTO_APPLY_CONFIDENCE = 80;

interface PreMatch {
    applicationId: string;
    source: 'thread' | 'domain';
}

/**
 * Fetch → dedupe → pre-match via thread or sender domain → classify with
 * local LLM (passing prior context) → store. All new mails are persisted
 * (even without a match) so the user can see what the LLM did. Mails with
 * confidence >= 80 auto-apply the status. Optionally emits progress events.
 */
export async function syncInbox(send?: EventSender): Promise<SyncResult> {
    const result: SyncResult = {
        fetched: 0,
        stored: 0,
        classified: 0,
        autoApplied: 0,
        dropped: 0,
        skippedDuplicates: 0,
        threadMatched: 0,
    };
    try {
        const latest = getLatestInboundReceivedAt();
        const since = latest
            ? new Date(new Date(latest).getTime() - 7 * 24 * 60 * 60 * 1000)
            : undefined;

        const profile = getUserProfile();
        const messages = await fetchRecentMessages({
            since,
            mailboxes: profile.imapMailboxes,
            includeRead: profile.imapIncludeRead,
        });
        result.fetched = messages.length;
        send?.('inbox:sync:started', { total: messages.length });

        const apps = listApplications();

        for (let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            send?.('inbox:sync:progress', {
                current: i + 1,
                total: messages.length,
                subject: msg.subject,
                fromAddress: msg.fromAddress,
                mailbox: msg.mailbox,
            });

            if (getInboundEmailByMessageId(msg.messageId)) {
                result.skippedDuplicates += 1;
                continue;
            }

            const preMatch = computePreMatch(msg, apps);
            if (preMatch?.source === 'thread') {
                result.threadMatched += 1;
            }

            const context = buildContextForApplication(preMatch?.applicationId, apps);

            const startedAt = Date.now();
            const classification = await classifyInboundEmail(
                {
                    subject: msg.subject,
                    fromAddress: msg.fromAddress,
                    fromName: msg.fromName,
                    bodyText: msg.bodyText,
                    context,
                } satisfies ClassifyInput,
                apps,
            );
            const durationMs = Date.now() - startedAt;

            // Thread is authoritative: override LLM if it picked nothing or
            // picked a different app. Domain hint is softer - only fill in
            // when LLM has no opinion.
            let appId = classification.applicationId;
            let confidence = classification.confidence;
            if (preMatch?.source === 'thread') {
                appId = preMatch.applicationId;
                confidence = Math.max(confidence, 90);
            } else if (preMatch?.source === 'domain' && !appId) {
                appId = preMatch.applicationId;
                confidence = Math.max(confidence, 60);
            }

            const inserted = insertInboundEmail({
                messageId: msg.messageId,
                fromAddress: msg.fromAddress,
                fromName: msg.fromName,
                subject: msg.subject,
                bodyText: msg.bodyText,
                receivedAt: msg.receivedAt,
                suggestedApplicationId: appId,
                suggestedStatus: classification.status,
                suggestedNote: classification.note,
                confidence,
                llmPrompt: classification.prompt,
                llmRawResponse: classification.rawResponse,
                mailbox: msg.mailbox,
                durationMs,
                inReplyTo: msg.inReplyTo,
                referenceIds: msg.referenceIds.join(','),
            });

            if (!inserted) {
                result.skippedDuplicates += 1;
                continue;
            }
            result.stored += 1;

            const progressPayload = {
                current: i + 1,
                total: messages.length,
                subject: msg.subject,
                fromAddress: msg.fromAddress,
                mailbox: msg.mailbox,
                durationMs,
            };

            if (!appId) {
                result.dropped += 1;
                send?.('inbox:sync:progress', progressPayload);
                continue;
            }

            const status = classification.status;
            if (status === null || status === 'other') {
                send?.('inbox:sync:progress', progressPayload);
                continue;
            }
            if (confidence >= AUTO_APPLY_CONFIDENCE) {
                applySuggestion(inserted.id, appId, status, classification.note);
                result.autoApplied += 1;
            } else {
                result.classified += 1;
            }

            send?.('inbox:sync:progress', progressPayload);
        }
    } catch (err) {
        result.error = (err as Error).message;
        console.error('[inbox] sync error:', err);
    }

    send?.('inbox:sync:finished', result);
    if (result.fetched > 0 || result.error) {
        console.log(
            `[inbox] sync done: fetched=${result.fetched} stored=${result.stored} threadMatched=${result.threadMatched} autoApplied=${result.autoApplied} classified=${result.classified} dropped=${result.dropped} dup=${result.skippedDuplicates}${result.error ? ' error=' + result.error : ''}`,
        );
    }
    return result;
}

/**
 * Try to pin an inbound mail to an application BEFORE asking the LLM.
 * Thread match (RFC822 In-Reply-To / References against our DB) is rock-solid
 * - same Message-ID can't appear twice. Domain match is softer: sender
 * domain unambiguously matches one application's contact or website.
 */
function computePreMatch(
    msg: RawInboundMessage,
    apps: ApplicationRow[],
): PreMatch | null {
    const threadIds = collectThreadIds(msg);
    if (threadIds.length > 0) {
        const sent = threadIds
            .map((id) => findSentEmailByMessageId(id))
            .find((r) => r !== null);
        if (sent) {
            return { applicationId: sent.applicationId, source: 'thread' };
        }
        const prevInbound = findInboundByAnyMessageId(threadIds);
        if (prevInbound?.suggestedApplicationId) {
            return {
                applicationId: prevInbound.suggestedApplicationId,
                source: 'thread',
            };
        }
    }

    const senderDomain = extractDomain(msg.fromAddress);
    if (!senderDomain) return null;

    const candidates = apps.filter((a) => {
        const contactDomain = extractDomain(a.contactEmail);
        if (contactDomain && contactDomain === senderDomain) return true;
        const websiteDomain = extractDomain(a.companyWebsite);
        if (websiteDomain && websiteDomain === senderDomain) return true;
        return false;
    });

    if (candidates.length === 1) {
        return { applicationId: candidates[0].id, source: 'domain' };
    }
    return null;
}

function collectThreadIds(msg: RawInboundMessage): string[] {
    const ids = new Set<string>();
    if (msg.inReplyTo) ids.add(msg.inReplyTo);
    for (const ref of msg.referenceIds) {
        if (ref) ids.add(ref);
    }
    return Array.from(ids);
}

function extractDomain(addressOrUrl: string): string {
    if (!addressOrUrl) return '';
    const atIdx = addressOrUrl.lastIndexOf('@');
    if (atIdx >= 0) {
        return addressOrUrl.slice(atIdx + 1).toLowerCase().replace(/^www\./, '');
    }
    try {
        const url = new URL(addressOrUrl.startsWith('http') ? addressOrUrl : 'http://' + addressOrUrl);
        return url.hostname.toLowerCase().replace(/^www\./, '');
    } catch {
        return '';
    }
}

function buildContextForApplication(
    applicationId: string | undefined,
    apps: ApplicationRow[],
): ClassifyContext | undefined {
    if (!applicationId) return undefined;
    const app = apps.find((a) => a.id === applicationId);
    if (!app) return undefined;

    const inbound = listInboundEmailsByApplication(applicationId);
    const sent = listEmailsForApplication(applicationId);

    return {
        likelyApplication: {
            id: app.id,
            companyName: app.companyName,
            jobTitle: app.jobTitle,
            status: app.status,
            notes: app.notes,
            interviews: app.interviews,
        },
        previousInbound: inbound.map((m) => ({
            receivedAt: m.receivedAt,
            fromAddress: m.fromAddress,
            subject: m.subject,
            bodyText: m.bodyText,
            matchedApplicationId: m.suggestedApplicationId,
            suggestedStatus: m.suggestedStatus,
        })),
        previousSent: sent.map((m) => ({
            sentAt: m.sentAt.toISOString(),
            toAddress: m.toAddress,
            subject: m.subject,
            body: m.body,
        })),
    };
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

const STARTUP_SYNC_DELAY_MS = 5_000;

let syncRunning = false;
let syncPending = false;
let watchers: IdleWatcher[] = [];

/**
 * One-shot sync that serializes concurrent triggers. While a sync is running,
 * additional triggers raise the `pending` flag - we run one more sync after
 * the current finishes, so back-to-back EXISTS events don't pile up.
 */
async function runSerializedSync(send: ReturnType<typeof createEventSender>): Promise<void> {
    if (syncRunning) {
        syncPending = true;
        return;
    }
    syncRunning = true;
    try {
        do {
            syncPending = false;
            try {
                const result = await syncInbox(send);
                send('inbox:autoSynced', result);
            } catch (err) {
                console.error('[inbox] sync trigger error:', err);
            }
        } while (syncPending);
    } finally {
        syncRunning = false;
    }
}

/**
 * Opens a persistent IMAP IDLE connection per configured mailbox. The server
 * notifies us in real time when new mail arrives; no polling. On disconnect
 * each watcher reconnects with exponential backoff. Triggers an initial sync
 * shortly after start to catch up on anything received while the app was
 * offline.
 */
export function startInboxIdleWatcher(
    getWindow: () => BrowserWindow | null,
): void {
    const send = createEventSender(getWindow);

    const trigger = () => {
        void runSerializedSync(send);
    };

    setTimeout(() => {
        const p = getUserProfile();
        if (!p.imapHost || !p.imapUser || !p.imapPassword) return;
        // Initial catch-up sync.
        trigger();
        // One persistent IDLE watcher per configured mailbox.
        const mailboxes = p.imapMailboxes.length > 0 ? p.imapMailboxes : ['INBOX'];
        for (const mailbox of mailboxes) {
            watchers.push(
                startIdleWatcher({
                    mailbox,
                    onNewMessage: trigger,
                    onError: (err) =>
                        console.warn(`[inbox] IDLE watcher "${mailbox}" error:`, err.message),
                }),
            );
        }
    }, STARTUP_SYNC_DELAY_MS);
}

export async function stopInboxIdleWatcher(): Promise<void> {
    const current = watchers;
    watchers = [];
    await Promise.all(current.map((w) => w.stop()));
}
