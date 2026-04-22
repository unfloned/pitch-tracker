import { useCallback, useEffect, useState } from 'react';
import type { ApplicationEvent, SentEmailRecord } from '../../../preload/index';

/**
 * Loads the status-change events and sent-email history for one application.
 * Re-fetches when the id changes. `reloadEmails` is exposed so that callers
 * can refresh after sending a new email without remounting the detail pane.
 */
export function useApplicationRelations(appId: string) {
    const [events, setEvents] = useState<ApplicationEvent[]>([]);
    const [emails, setEmails] = useState<SentEmailRecord[]>([]);

    const reloadEmails = useCallback(() => {
        window.api.email
            .listForApp(appId)
            .then(setEmails)
            .catch(() => setEmails([]));
    }, [appId]);

    useEffect(() => {
        let cancelled = false;
        window.api.applications.events
            .forApp(appId)
            .then((list) => {
                if (!cancelled) setEvents(list);
            })
            .catch(() => {
                if (!cancelled) setEvents([]);
            });
        window.api.email
            .listForApp(appId)
            .then((list) => {
                if (!cancelled) setEmails(list);
            })
            .catch(() => {
                if (!cancelled) setEmails([]);
            });
        return () => {
            cancelled = true;
        };
    }, [appId]);

    return { events, emails, reloadEmails };
}
