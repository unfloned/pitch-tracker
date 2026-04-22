import { useTranslation } from 'react-i18next';
import type { ApplicationRecord } from '../../../preload/index';
import { GhostBtn } from '../primitives/GhostBtn';
import { Kbd } from '../primitives/Kbd';

interface Props {
    app: ApplicationRecord;
    onEdit: (app: ApplicationRecord) => void;
    onDelete: (id: string) => void;
    /** Triggered when the user wants to open the email dialog.
     *  autoApply=true also sets status='applied' after a successful send. */
    onEmail: (autoApply: boolean) => void;
}

/**
 * Action bar at the bottom of the detail pane. Context-aware email button:
 *   - status=draft → "Bewerben" (active/dark, autoApply=true)
 *   - other + contactEmail set → "Email" (follow-up, no status change)
 *   - no contactEmail → email button hidden
 */
export function DetailFooter({ app, onEdit, onDelete, onEmail }: Props) {
    const { t } = useTranslation();
    const canEmail = Boolean(app.contactEmail);
    const applyMode = canEmail && app.status === 'draft';

    return (
        <div
            style={{
                display: 'flex',
                gap: 6,
                padding: 12,
                borderTop: '1px solid var(--rule)',
                background: 'var(--paper-2)',
                flexShrink: 0,
                flexWrap: 'wrap',
            }}
        >
            <GhostBtn onClick={() => onEdit(app)}>
                <span>{t('detail.actions.edit', 'Edit')}</span>
                <Kbd>⌘.</Kbd>
            </GhostBtn>
            {app.jobUrl && (
                <GhostBtn onClick={() => window.api.shell.openExternal(app.jobUrl)}>
                    <span>{t('detail.actions.openPosting', 'Open posting')}</span>
                </GhostBtn>
            )}
            {canEmail && (
                <GhostBtn
                    active={applyMode}
                    onClick={() => onEmail(applyMode)}
                    title={app.contactEmail}
                    style={
                        applyMode
                            ? {
                                  background: 'var(--ink)',
                                  color: 'var(--paper)',
                                  borderColor: 'var(--ink)',
                              }
                            : undefined
                    }
                >
                    <span>
                        {applyMode
                            ? t('detail.actions.apply', 'Bewerben')
                            : t('detail.actions.email', 'Email')}
                    </span>
                    <Kbd tone={applyMode ? 'dark' : 'light'}>⌘E</Kbd>
                </GhostBtn>
            )}
            <div style={{ flex: 1 }} />
            <GhostBtn
                onClick={() => {
                    if (
                        confirm(
                            t('confirm.deleteApplication', {
                                name: app.companyName || app.jobTitle || '',
                            }),
                        )
                    ) {
                        onDelete(app.id);
                    }
                }}
            >
                <span>{t('common.delete', 'Delete')}</span>
            </GhostBtn>
        </div>
    );
}
