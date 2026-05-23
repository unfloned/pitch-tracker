import { useEffect, useState } from 'react';

export interface RunningAgent {
    id: string;
    label: string;
}

/**
 * Tracks which agent searches are currently running. Subscribes to the same
 * `agents:runStarted` / `agents:runFinished` events the StatusFooter uses,
 * plus a one-shot fetch of `runningSearches` on mount in case an agent was
 * already running when the user navigated to the page. Search labels are
 * cached so the indicator can show them even when an event arrives before
 * the search list has loaded.
 */
export function useRunningAgents(): RunningAgent[] {
    const [running, setRunning] = useState<Map<string, string>>(new Map());

    useEffect(() => {
        const labels = new Map<string, string>();

        const loadLabels = async () => {
            const searches = await window.api.agents.listSearches();
            for (const s of searches) labels.set(s.id, s.label);
        };

        const sync = async () => {
            await loadLabels();
            const ids = await window.api.agents.runningSearches();
            const next = new Map<string, string>();
            for (const id of ids) next.set(id, labels.get(id) ?? 'Search');
            setRunning(next);
        };
        sync();

        const offStart = window.api.on(
            'agents:runStarted',
            async (p: { searchId: string }) => {
                if (!labels.has(p.searchId)) await loadLabels();
                setRunning((prev) => {
                    const next = new Map(prev);
                    next.set(p.searchId, labels.get(p.searchId) ?? 'Search');
                    return next;
                });
            },
        );
        const offFinished = window.api.on(
            'agents:runFinished',
            (p: { searchId: string }) => {
                setRunning((prev) => {
                    if (!prev.has(p.searchId)) return prev;
                    const next = new Map(prev);
                    next.delete(p.searchId);
                    return next;
                });
            },
        );

        return () => {
            offStart();
            offFinished();
        };
    }, []);

    return [...running.entries()].map(([id, label]) => ({ id, label }));
}
