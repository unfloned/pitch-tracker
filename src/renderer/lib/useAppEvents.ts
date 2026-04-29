import { notifications } from '@mantine/notifications';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface Handlers {
    /** Reload the application list (after auto-import / inbox sync). */
    refresh: () => void | Promise<void>;
    /** Reload the new-candidate badge counter. */
    refreshCandidateCount: () => void | Promise<void>;
    /** Open the new-entry drawer. */
    openNew: () => void;
    /** Open the quick-add drawer prefilled with the given URL. */
    openQuickAdd: (url: string) => void;
    /** Navigate to a specific application's detail view. */
    openApplication: (id: string) => void;
}

/**
 * Subscribes to every renderer event the App shell cares about and routes
 * them to the supplied handlers. Owns the notifications side-effects so the
 * App component itself stays focused on layout and routing.
 *
 * Each registered listener returns its own unsubscribe; the cleanup below
 * calls all of them on unmount.
 */
export function useAppEvents(handlers: Handlers): void {
    const { t } = useTranslation();
    const { refresh, refreshCandidateCount, openNew, openQuickAdd, openApplication } = handlers;

    useEffect(() => {
        const unsubs: Array<() => void> = [];

        unsubs.push(
            window.api.on('navigate', (target) => {
                if (target === 'new') openNew();
            }),
        );

        unsubs.push(
            window.api.on('navigate:quickAdd', (payload) => {
                openQuickAdd(payload.url || '');
            }),
        );

        unsubs.push(
            window.api.on('navigate:openApplication', (id) => {
                openApplication(id);
            }),
        );

        unsubs.push(
            window.api.on('agents:autoImported', (payload) => {
                notifications.show({
                    color: 'teal',
                    title: t('notifications.autoImportedTitle', { score: payload.score }),
                    message: payload.candidate,
                });
                refresh();
                refreshCandidateCount();
            }),
        );

        unsubs.push(
            window.api.on('agents:candidateAdded', () => {
                refreshCandidateCount();
            }),
        );

        unsubs.push(
            window.api.on('agents:runFinished', (payload) => {
                refreshCandidateCount();
                if (payload.canceled) {
                    notifications.show({
                        color: 'gray',
                        message: t('notifications.agentRunCanceled'),
                    });
                    return;
                }
                const stats = t('notifications.agentRunFinishedStats', {
                    scanned: payload.scanned,
                    added: payload.added,
                });
                notifications.show({
                    color: payload.added > 0 ? 'green' : 'gray',
                    title: t('notifications.agentRunFinishedTitle'),
                    message:
                        payload.errors.length > 0
                            ? t('notifications.agentRunFinishedWithErrors', {
                                  stats,
                                  errors: payload.errors.join('; '),
                              })
                            : stats,
                    autoClose: 6000,
                });
            }),
        );

        unsubs.push(
            window.api.on('reminders:followUp', (payload) => {
                notifications.show({
                    color: 'yellow',
                    title: t('notifications.followUpTitle', { days: payload.daysSinceApplied }),
                    message: payload.companyName,
                    autoClose: 10000,
                });
            }),
        );

        unsubs.push(
            window.api.on('inbox:autoSynced', (payload) => {
                if (payload.error) return;
                if (payload.autoApplied === 0 && payload.classified === 0) return;
                refresh();
                if (payload.autoApplied > 0) {
                    notifications.show({
                        color: 'green',
                        title: t('notifications.autoAppliedTitle', {
                            count: payload.autoApplied,
                        }),
                        message: t('notifications.autoAppliedBody', {
                            pending: payload.classified,
                        }),
                        autoClose: 6000,
                    });
                }
            }),
        );

        return () => {
            for (const off of unsubs) off();
        };
    }, [refresh, refreshCandidateCount, openNew, openQuickAdd, openApplication, t]);
}
