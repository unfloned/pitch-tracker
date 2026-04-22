import { Center, Stack } from '@mantine/core';
import { IconSparkles } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { GhostBtn } from '../primitives/GhostBtn';

interface InitialProps {
    onGoToAgents: () => void;
}

/** No candidates at all yet — agents haven't been configured / run. */
export function InitialEmpty({ onGoToAgents }: InitialProps) {
    const { t } = useTranslation();
    return (
        <Center mih={400}>
            <Stack align="center" gap="md" maw={420}>
                <IconSparkles size={48} style={{ opacity: 0.3, color: 'var(--ink-4)' }} />
                <div style={{ textAlign: 'center' }}>
                    <div
                        className="serif"
                        style={{ fontSize: 19, fontWeight: 500, color: 'var(--ink)' }}
                    >
                        {t('candidates.emptyTitle')}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4 }}>
                        {t('candidates.emptySubtitle')}
                    </div>
                </div>
                <GhostBtn
                    active
                    onClick={onGoToAgents}
                    style={{
                        background: 'var(--ink)',
                        color: 'var(--paper)',
                        borderColor: 'var(--ink)',
                    }}
                >
                    <span>{t('nav.agents')}</span>
                </GhostBtn>
            </Stack>
        </Center>
    );
}

/** Candidates exist but none match the current filters. */
export function NoMatchBanner() {
    const { t } = useTranslation();
    return (
        <div
            style={{
                padding: 32,
                textAlign: 'center',
                border: '1px solid var(--rule)',
                background: 'var(--card)',
            }}
        >
            <div
                className="serif"
                style={{ fontSize: 17, fontWeight: 500, color: 'var(--ink)' }}
            >
                {t('candidates.emptyTitle')}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 6 }}>
                {t('candidates.emptySubtitle')}
            </div>
        </div>
    );
}
