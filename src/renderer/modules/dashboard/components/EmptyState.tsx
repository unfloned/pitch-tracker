import { IconSparkles } from '@tabler/icons-react';
import { Button } from '@mantine/core';
import { useTranslation } from 'react-i18next';

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
                gap: 20,
            }}
        >
            <div
                style={{
                    width: 64,
                    height: 64,
                    background: 'var(--accent-soft)',
                    borderRadius: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent)',
                }}
            >
                <IconSparkles size={28} />
            </div>
            <div style={{ textAlign: 'center', maxWidth: 440 }}>
                <div
                    style={{
                        fontSize: 24,
                        fontWeight: 600,
                        color: 'var(--text)',
                        letterSpacing: '-0.02em',
                        marginBottom: 8,
                    }}
                >
                    {t('dashboard.welcomeTitle')}
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.55 }}>
                    {t('dashboard.welcomeSubtitle')}
                </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
                <Button onClick={onNewEntry} variant="filled">
                    ＋ {t('toolbar.newEntry')}
                </Button>
                <Button onClick={onGoToAgents} variant="subtle">
                    {t('nav.agents')}
                </Button>
            </div>
        </div>
    );
}
