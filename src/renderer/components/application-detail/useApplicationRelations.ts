import { useCallback, useEffect, useState } from 'react';
import type {
    ApplicationEvent,
    InboundEmailDto,
    SentEmailRecord,
} from '../../../preload/index';

/**
 * Loads status-change events, sent-email history and inbound replies for one
 * application. Re-fetches when the id changes. `reloadEmails` refreshes both
 * directions; `reloadInbounds` exists for callers that only triggered a
 * status change on an inbound suggestion.
 */
export function useApplicationRelations(appId: string) {
    const [events, setEvents] = useState<ApplicationEvent[]>([]);
    const [emails, setEmails] = useState<SentEmailRecord[]>([]);
    const [inbounds, setInbounds] = useState<InboundEmailDto[]>([]);

    const reloadInbounds = useCallback(() => {
        window.api.inbox
            .listForApp(appId)
            .then(setInbounds)
            .catch(() => setInbounds([]));
    }, [appId]);

    const reloadEmails = useCallback(() => {
        window.api.email
            .listForApp(appId)
            .then(setEmails)
            .catch(() => setEmails([]));
        reloadInbounds();
    }, [appId, reloadInbounds]);

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
        window.api.inbox
            .listForApp(appId)
            .then((list) => {
                if (!cancelled) setInbounds(list);
            })
            .catch(() => {
                if (!cancelled) setInbounds([]);
            });
        return () => {
            cancelled = true;
        };
    }, [appId]);

    return { events, emails, inbounds, reloadEmails, reloadInbounds };
}
