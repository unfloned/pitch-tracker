import { useTranslation } from 'react-i18next';
import { GhostBtn } from '../primitives/GhostBtn';
import { Kbd } from '../primitives/Kbd';

interface Props {
    ollamaRunning: boolean | null;
    drafting: boolean;
    sending: boolean;
    canSend: boolean;
    onDraft: () => void;
    onCancel: () => void;
    onSend: () => void;
}

export function EmailFooter({
    ollamaRunning,
    drafting,
    sending,
    canSend,
    onDraft,
    onCancel,
    onSend,
}: Props) {
    const { t } = useTranslation();
    return (
        <div
            style={{
                display: 'flex',
                gap: 6,
                padding: 12,
                borderTop: '1px solid var(--rule)',
                background: 'var(--paper-2)',
                flexShrink: 0,
            }}
        >
            {ollamaRunning && (
                <GhostBtn onClick={onDraft} disabled={drafting}>
                    <span>
                        {drafting
                            ? t('email.drafting', 'Entwurf läuft…')
                            : t('email.draft', 'LLM-Entwurf')}
                    </span>
                    <Kbd>⌘D</Kbd>
                </GhostBtn>
            )}
            <div style={{ flex: 1 }} />
            <GhostBtn onClick={onCancel} disabled={sending}>
                <span>{t('common.cancel')}</span>
            </GhostBtn>
            <GhostBtn
                active
                onClick={onSend}
                disabled={!canSend || sending}
                style={{
                    background: canSend ? 'var(--ink)' : 'var(--paper-2)',
                    color: canSend ? 'var(--paper)' : 'var(--ink-4)',
                    borderColor: canSend ? 'var(--ink)' : 'var(--rule)',
                }}
            >
                <span>{sending ? t('email.sending', 'Sendet…') : t('email.send')}</span>
                <Kbd tone={canSend ? 'dark' : 'light'}>⇧⌘↵</Kbd>
            </GhostBtn>
        </div>
    );
}
