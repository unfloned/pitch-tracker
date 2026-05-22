import { randomUUID } from 'node:crypto';
import type { ApplicationStatus } from '@shared/application';
import { getDb } from './init';

export type InboundReviewStatus = 'pending' | 'applied' | 'dismissed';

export interface InboundEmailRow {
    id: string;
    messageId: string;
    fromAddress: string;
    fromName: string;
    subject: string;
    bodyText: string;
    receivedAt: string;
    fetchedAt: string;
    suggestedApplicationId: string | null;
    suggestedStatus: ApplicationStatus | 'other' | null;
    suggestedNote: string;
    confidence: number;
    reviewStatus: InboundReviewStatus;
    llmPrompt: string;
    llmRawResponse: string;
    mailbox: string;
    durationMs: number;
    inReplyTo: string;
    referenceIds: string;
}

export interface InboundEmailInput {
    messageId: string;
    fromAddress: string;
    fromName: string;
    subject: string;
    bodyText: string;
    receivedAt: string;
    suggestedApplicationId: string | null;
    suggestedStatus: ApplicationStatus | 'other' | null;
    suggestedNote: string;
    confidence: number;
    llmPrompt: string;
    llmRawResponse: string;
    mailbox: string;
    durationMs: number;
    inReplyTo: string;
    referenceIds: string;
}

export function insertInboundEmail(input: InboundEmailInput): InboundEmailRow | null {
    const db = getDb();
    const id = randomUUID();
    const fetchedAt = new Date().toISOString();
    // INSERT OR IGNORE by messageId so repeated fetches are idempotent.
    const result = db
        .prepare(
            `INSERT OR IGNORE INTO inbound_emails (
                id, messageId, fromAddress, fromName, subject, bodyText, receivedAt, fetchedAt,
                suggestedApplicationId, suggestedStatus, suggestedNote, confidence, reviewStatus,
                llmPrompt, llmRawResponse, mailbox, durationMs, inReplyTo, referenceIds
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?)`,
        )
        .run(
            id,
            input.messageId,
            input.fromAddress,
            input.fromName,
            input.subject,
            input.bodyText,
            input.receivedAt,
            fetchedAt,
            input.suggestedApplicationId,
            input.suggestedStatus,
            input.suggestedNote,
            input.confidence,
            input.llmPrompt,
            input.llmRawResponse,
            input.mailbox,
            input.durationMs,
            input.inReplyTo,
            input.referenceIds,
        );
    if (result.changes === 0) return null;
    return getInboundEmailByMessageId(input.messageId);
}

export function getInboundEmailByMessageId(messageId: string): InboundEmailRow | null {
    const db = getDb();
    const row = db
        .prepare('SELECT * FROM inbound_emails WHERE messageId = ?')
        .get(messageId) as InboundEmailRow | undefined;
    return row ?? null;
}

export function listInboundEmails(reviewStatus?: InboundReviewStatus): InboundEmailRow[] {
    const db = getDb();
    if (reviewStatus) {
        return db
            .prepare('SELECT * FROM inbound_emails WHERE reviewStatus = ? ORDER BY receivedAt DESC')
            .all(reviewStatus) as InboundEmailRow[];
    }
    return db
        .prepare('SELECT * FROM inbound_emails ORDER BY receivedAt DESC')
        .all() as InboundEmailRow[];
}

export function listInboundEmailsByApplication(applicationId: string): InboundEmailRow[] {
    const db = getDb();
    return db
        .prepare(
            'SELECT * FROM inbound_emails WHERE suggestedApplicationId = ? ORDER BY receivedAt DESC',
        )
        .all(applicationId) as InboundEmailRow[];
}

export function setInboundReviewStatus(id: string, status: InboundReviewStatus): void {
    getDb()
        .prepare('UPDATE inbound_emails SET reviewStatus = ? WHERE id = ?')
        .run(status, id);
}

export function updateInboundSuggestion(
    id: string,
    suggestedApplicationId: string | null,
    suggestedStatus: ApplicationStatus | 'other' | null,
): void {
    getDb()
        .prepare(
            'UPDATE inbound_emails SET suggestedApplicationId = ?, suggestedStatus = ? WHERE id = ?',
        )
        .run(suggestedApplicationId, suggestedStatus, id);
}

/**
 * Look up an inbound email by any of the given Message-IDs. Used for thread
 * pre-matching: if a new mail references a Message-ID we already classified,
 * we can inherit its application without asking the LLM.
 */
export function findInboundByAnyMessageId(messageIds: string[]): InboundEmailRow | null {
    if (messageIds.length === 0) return null;
    const placeholders = messageIds.map(() => '?').join(',');
    const row = getDb()
        .prepare(`SELECT * FROM inbound_emails WHERE messageId IN (${placeholders}) LIMIT 1`)
        .get(...messageIds) as InboundEmailRow | undefined;
    return row ?? null;
}

/**
 * Look up a sent email by Message-ID. If the user sent the original mail and
 * the reply references its Message-ID, we know the application directly.
 */
export function findSentEmailByMessageId(messageId: string): {
    applicationId: string;
    messageId: string;
} | null {
    if (!messageId) return null;
    const row = getDb()
        .prepare(
            "SELECT applicationId, messageId FROM email_log WHERE messageId = ? AND messageId != ''",
        )
        .get(messageId) as { applicationId: string; messageId: string } | undefined;
    return row ?? null;
}

export function getLatestInboundReceivedAt(): string | null {
    const db = getDb();
    const row = db
        .prepare('SELECT MAX(receivedAt) as max FROM inbound_emails')
        .get() as { max: string | null } | undefined;
    return row?.max ?? null;
}
