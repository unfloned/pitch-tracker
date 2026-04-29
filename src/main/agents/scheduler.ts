import type { BrowserWindow } from 'electron';
import { INTERVAL_MS } from '@shared/job-search';
import { createEventSender } from '../ipc/events';
import { isSearchRunning, runSearchNow } from './runs';
import { listSearches } from './searches';

/**
 * Polls every minute for due searches and fires them off. First poll runs
 * 15s after startup so we don't compete with app init. Skips manual
 * searches and any run that's already in flight.
 */
export function startAgentScheduler(getWindow: () => BrowserWindow | null): void {
    const send = createEventSender(getWindow);

    const runDue = async () => {
        const now = Date.now();
        const searches = listSearches().filter((s) => s.enabled && s.interval !== 'manual');
        for (const search of searches) {
            if (isSearchRunning(search.id)) continue;
            const nextDue = search.lastRunAt
                ? new Date(search.lastRunAt).getTime() + INTERVAL_MS[search.interval]
                : 0;
            if (nextDue > now) continue;
            try {
                await runSearchNow(search.id, { sendEvent: send });
            } catch (err) {
                console.error('[agents] Scheduled run error:', (err as Error).message);
            }
        }
    };

    setTimeout(runDue, 15000);
    setInterval(runDue, 60 * 1000);
}
