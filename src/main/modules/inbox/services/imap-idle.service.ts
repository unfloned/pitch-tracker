import type { ImapFlow } from 'imapflow';
import { clientFromProfile } from './imap-client.service';

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
