import { randomUUID } from 'node:crypto';
import { getDb } from './init';
import type { EmailLogRow } from './types';
import { nowIso } from './utils';

interface LogInput {
    applicationId: string;
    toAddress: string;
    subject: string;
    body: string;
    messageId?: string;
    status?: 'ok' | 'failed';
}

export function logSentEmail(entry: LogInput): EmailLogRow {
    const id = randomUUID();
    const sentAt = nowIso();
    getDb()
        .prepare(
            `INSERT INTO email_log (id, applicationId, toAddress, subject, body, sentAt, messageId, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
            id,
            entry.applicationId,
            entry.toAddress,
            entry.subject,
            entry.body,
            sentAt,
            entry.messageId ?? null,
            entry.status ?? 'ok',
        );
    return {
        id,
        applicationId: entry.applicationId,
        toAddress: entry.toAddress,
        subject: entry.subject,
        body: entry.body,
        sentAt: new Date(sentAt),
        messageId: entry.messageId ?? null,
        status: entry.status ?? 'ok',
    };
}

export function listEmailsForApplication(applicationId: string): EmailLogRow[] {
    const rows = getDb()
        .prepare(
            'SELECT id, applicationId, toAddress, subject, body, sentAt, messageId, status FROM email_log WHERE applicationId = ? ORDER BY sentAt DESC',
        )
        .all(applicationId) as RawEmailRow[];
    return rows.map((r) => ({
        id: r.id,
        applicationId: r.applicationId,
        toAddress: r.toAddress,
        subject: r.subject,
        body: r.body,
        sentAt: new Date(r.sentAt),
        messageId: r.messageId,
        status: r.status,
    }));
}

interface RawEmailRow {
    id: string;
    applicationId: string;
    toAddress: string;
    subject: string;
    body: string;
    sentAt: string;
    messageId: string | null;
    status: string;
}
