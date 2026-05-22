import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { getUserProfile } from '../profile';

export interface RawInboundMessage {
    messageId: string;
    fromAddress: string;
    fromName: string;
    subject: string;
    bodyText: string;
    receivedAt: string;
    mailbox: string;
    /** Message-ID this mail is a direct reply to (RFC822 In-Reply-To). */
    inReplyTo: string;
    /** Full thread chain from RFC822 References, ordered oldest → newest. */
    referenceIds: string[];
}

export interface ImapTestResult {
    ok: boolean;
    error?: string;
    inboxMessages?: number;
}

export interface MailboxInfo {
    path: string;
    name: string;
    specialUse?: string;
    subscribed: boolean;
    flags: string[];
}

export interface ListMailboxesResult {
    ok: boolean;
    error?: string;
    mailboxes?: MailboxInfo[];
}

export interface FetchOptions {
    /** Default: last 30 days */
    since?: Date;
    /** Default: ['INBOX'] */
    mailboxes?: string[];
    /** Default: false. When true, also pulls already-seen messages. */
    includeRead?: boolean;
}

/**
 * Build a fresh ImapFlow client from the saved user profile. Returns null
 * when IMAP is not configured. Exported for the IDLE watcher in the
 * sibling module - external callers go through the helpers below.
 */
export function clientFromProfile(): ImapFlow | null {
    const p = getUserProfile();
    if (!p.imapHost || !p.imapUser || !p.imapPassword) return null;
    return new ImapFlow({
        host: p.imapHost,
        port: p.imapPort || 993,
        secure: p.imapSecure !== false,
        auth: { user: p.imapUser, pass: p.imapPassword },
        logger: false,
        // Without these, a wrong host can hang the call indefinitely.
        connectionTimeout: 15_000,
        greetingTimeout: 15_000,
        socketTimeout: 60_000,
    });
}

export async function testImapConnection(): Promise<ImapTestResult> {
    const client = clientFromProfile();
    if (!client) return { ok: false, error: 'IMAP is not configured' };
    try {
        await client.connect();
        const lock = await client.getMailboxLock('INBOX');
        try {
            const mbox = client.mailbox;
            const count = typeof mbox === 'object' ? mbox.exists : 0;
            return { ok: true, inboxMessages: count };
        } finally {
            lock.release();
        }
    } catch (err) {
        return { ok: false, error: (err as Error).message };
    } finally {
        try {
            await client.logout();
        } catch {
            // ignore
        }
    }
}

/**
 * Connect once and list all mailbox paths available on the server (including
 * nested folders and shared/public namespaces). Used by the settings UI to
 * populate the mailbox multi-select.
 */
export async function listMailboxes(): Promise<ListMailboxesResult> {
    const client = clientFromProfile();
    if (!client) return { ok: false, error: 'IMAP is not configured' };
    try {
        await client.connect();
        const tree = await client.list();
        const mailboxes: MailboxInfo[] = tree.map((m) => ({
            path: m.path,
            name: m.name,
            specialUse: m.specialUse,
            subscribed: m.subscribed ?? false,
            flags: Array.from(m.flags ?? []),
        }));
        return { ok: true, mailboxes };
    } catch (err) {
        return { ok: false, error: (err as Error).message };
    } finally {
        try {
            await client.logout();
        } catch {
            // ignore
        }
    }
}

/**
 * Fetch messages from one or more IMAP mailboxes. Does NOT mark messages as
 * seen on the server. Deduplication against our own DB happens on the caller
 * side via RFC822 messageId.
 */
export async function fetchRecentMessages(
    options: FetchOptions = {},
): Promise<RawInboundMessage[]> {
    const since =
        options.since ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const mailboxes =
        options.mailboxes && options.mailboxes.length > 0
            ? options.mailboxes
            : ['INBOX'];
    const includeRead = options.includeRead === true;

    const client = clientFromProfile();
    if (!client) throw new Error('IMAP is not configured');

    await client.connect();
    const results: RawInboundMessage[] = [];

    try {
        for (const mailbox of mailboxes) {
            const lock = await client.getMailboxLock(mailbox).catch((err) => {
                console.warn(
                    `[imap] could not open mailbox "${mailbox}":`,
                    (err as Error).message,
                );
                return null;
            });
            if (!lock) continue;
            try {
                const search = await client.search(
                    includeRead ? { since } : { since, seen: false },
                );
                if (!search || search.length === 0) continue;

                for await (const msg of client.fetch(search, {
                    source: true,
                    envelope: true,
                    internalDate: true,
                })) {
                    if (!msg.source) continue;
                    const parsed = await simpleParser(msg.source as Buffer);
                    const fromAddr = parsed.from?.value?.[0];
                    const messageId =
                        parsed.messageId ??
                        `imap:${msg.uid}@${msg.emailId ?? msg.seq}`;
                    const receivedAtDate =
                        parsed.date ??
                        (msg.internalDate as Date | undefined) ??
                        new Date();
                    const receivedAt =
                        receivedAtDate instanceof Date
                            ? receivedAtDate.toISOString()
                            : new Date(receivedAtDate).toISOString();

                    const inReplyTo =
                        typeof parsed.inReplyTo === 'string' ? parsed.inReplyTo.trim() : '';
                    const referenceIds = Array.isArray(parsed.references)
                        ? parsed.references.filter((r): r is string => typeof r === 'string')
                        : typeof parsed.references === 'string'
                          ? parsed.references.split(/\s+/).filter(Boolean)
                          : [];

                    results.push({
                        messageId,
                        fromAddress: fromAddr?.address ?? '',
                        fromName: fromAddr?.name ?? '',
                        subject: parsed.subject ?? '',
                        bodyText: (parsed.text ?? stripHtmlFallback(parsed.html)).slice(
                            0,
                            20000,
                        ),
                        receivedAt,
                        mailbox,
                        inReplyTo,
                        referenceIds,
                    });
                }
            } finally {
                lock.release();
            }
        }
    } finally {
        try {
            await client.logout();
        } catch {
            // ignore
        }
    }

    return results;
}

function stripHtmlFallback(html: string | false | undefined): string {
    if (!html) return '';
    return html
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
