import {
    getInboundEmailByMessageId,
    getLatestInboundReceivedAt,
    insertInboundEmail,
    listApplications,
} from '../db';
import { getUserProfile } from '../profile';
import type { EventSender } from '../ipc/events';
import { classifyInboundEmail } from './classifier';
import type { ClassifyInput } from './classifier-prompt';
import { buildContextForApplication } from './context';
import { fetchRecentMessages } from './imap-client';
import { applySuggestion } from './suggestions';
import { computePreMatch } from './thread-match';

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
