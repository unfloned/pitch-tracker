import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { getUserProfile } from './profile';

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

function clientFromProfile(): ImapFlow | null {
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

export interface FetchOptions {
    /** Default: last 30 days */
    since?: Date;
    /** Default: ['INBOX'] */
    mailboxes?: string[];
    /** Default: false. When true, also pulls already-seen messages. */
    includeRead?: boolean;
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

/**
 * Persistent IMAP IDLE watcher for one mailbox. When the server reports a new
 * message via the `exists` event, the callback is fired so the caller can
 * trigger a sync. On disconnect we reconnect with exponential backoff (capped
 * at 5min) until `stop()` is called. Each watcher owns its own connection.
 */
export interface IdleWatcher {
    stop(): Promise<void>;
}

export interface IdleWatcherOptions {
    mailbox: string;
    onNewMessage: () => void;
    onError?: (err: Error) => void;
}

const IDLE_BACKOFF_INITIAL_MS = 5_000;
const IDLE_BACKOFF_MAX_MS = 5 * 60_000;

export function startIdleWatcher(opts: IdleWatcherOptions): IdleWatcher {
    let stopped = false;
    let client: ImapFlow | null = null;
    let backoffMs = IDLE_BACKOFF_INITIAL_MS;

    const tick = async () => {
        while (!stopped) {
            const fresh = clientFromProfile();
            if (!fresh) {
                // IMAP not configured (yet) - wait and retry. The user might
                // be filling in credentials right now.
                await sleep(IDLE_BACKOFF_MAX_MS);
                continue;
            }
            client = fresh;
            try {
                await client.connect();
                const lock = await client.getMailboxLock(opts.mailbox);
                let initialExists = -1;
                const mbox = client.mailbox;
                if (typeof mbox === 'object') initialExists = mbox.exists;

                // The `exists` event fires every time the server signals a
                // new EXISTS value during IDLE. We fire the callback only
                // when the count grows (not on initial sync echo).
                const onExists = (data: { count: number }) => {
                    if (initialExists < 0 || data.count > initialExists) {
                        initialExists = data.count;
                        try {
                            opts.onNewMessage();
                        } catch (err) {
                            opts.onError?.(err as Error);
                        }
                    }
                };
                client.on('exists', onExists);

                // After mailboxOpen, imapflow auto-enters IDLE on idle.
                // We sit here until the connection drops; close releases.
                backoffMs = IDLE_BACKOFF_INITIAL_MS;
                await new Promise<void>((resolve) => {
                    const cleanup = () => {
                        client?.off('exists', onExists);
                        client?.off('close', cleanup);
                        resolve();
                    };
                    client?.on('close', cleanup);
                    if (stopped) cleanup();
                });
                lock.release();
            } catch (err) {
                opts.onError?.(err as Error);
            } finally {
                try {
                    await client?.logout();
                } catch {
                    // ignore
                }
                client = null;
            }
            if (stopped) break;
            await sleep(backoffMs);
            backoffMs = Math.min(backoffMs * 2, IDLE_BACKOFF_MAX_MS);
        }
    };

    void tick();

    return {
        async stop() {
            stopped = true;
            try {
                await client?.logout();
            } catch {
                // ignore
            }
        },
    };
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function stripHtmlFallback(html: string | false | undefined): string {
    if (!html) return '';
    return html
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
