import { IconSparkles } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { GhostBtn } from '../primitives/GhostBtn';

interface Props {
    onNewEntry: () => void;
    onGoToAgents: () => void;
}

export function EmptyState({ onNewEntry, onGoToAgents }: Props) {
    const { t } = useTranslation();
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 500,
                gap: 16,
            }}
        >
            <div
                style={{
                    width: 56,
                    height: 56,
                    background: 'var(--accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--ink)',
                }}
            >
                <IconSparkles size={28} />
            </div>
            <div style={{ textAlign: 'center', maxWidth: 420 }}>
                <div
                    className="serif"
                    style={{
                        fontSize: 22,
                        fontWeight: 500,
                        color: 'var(--ink)',
                        letterSpacing: '-0.015em',
                        marginBottom: 6,
                    }}
                >
                    {t('dashboard.welcomeTitle')}
                </div>
                <div style={{ fontSize: 13.5, color: 'var(--ink-3)', lineHeight: 1.5 }}>
                    {t('dashboard.welcomeSubtitle')}
                </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
                <GhostBtn
                    active
                    onClick={onNewEntry}
                    style={{
                        background: 'var(--ink)',
                        color: 'var(--paper)',
                        borderColor: 'var(--ink)',
                    }}
                >
                    <span>＋ {t('toolbar.newEntry')}</span>
                </GhostBtn>
                <GhostBtn onClick={onGoToAgents}>
                    <span>{t('nav.agents')}</span>
                </GhostBtn>
            </div>
        </div>
    );
}
