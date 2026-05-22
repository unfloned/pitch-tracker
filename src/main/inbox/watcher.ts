import type { BrowserWindow } from 'electron';
import { getUserProfile } from '../profile';
import { createEventSender, type EventSender } from '../ipc/events';
import { startIdleWatcher, type IdleWatcher } from './imap-idle';
import { syncInbox } from './sync';

const STARTUP_SYNC_DELAY_MS = 5_000;

let syncRunning = false;
let syncPending = false;
let watchers: IdleWatcher[] = [];

/**
 * One-shot sync that serializes concurrent triggers. While a sync is running,
 * additional triggers raise the `pending` flag - we run one more sync after
 * the current finishes, so back-to-back EXISTS events don't pile up.
 */
async function runSerializedSync(send: EventSender): Promise<void> {
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
