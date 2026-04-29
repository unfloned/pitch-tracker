import { useTranslation } from 'react-i18next';
import type { CandidateCountsDto } from '../../../preload/index';
import { GhostBtn } from '../primitives/GhostBtn';
import { Label } from '../primitives/Label';
import { RunningAgentsBadge } from './RunningAgentsBadge';
import type { CandidateBucket } from './useCandidates';
import type { RunningAgent } from './useRunningAgents';

interface Props {
    bucket: CandidateBucket;
    onBucketChange: (b: CandidateBucket) => void;
    filteredCount: number;
    counts: CandidateCountsDto;
    runningAgents: RunningAgent[];
    onGoToAgents: () => void;
    onCleanupLowScore: () => void;
}

export function PageHeader({
    bucket,
    onBucketChange,
    filteredCount,
    counts,
    runningAgents,
    onGoToAgents,
    onCleanupLowScore,
}: Props) {
    const { t } = useTranslation();
    const bucketTotal = bucket === 'ignored' ? counts.ignored : counts.active;

    return (
        <div>
            <Label>{t('tabs.candidates')}</Label>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 4 }}>
                <span
                    className="serif"
                    style={{
                        fontSize: 28,
                        fontWeight: 500,
                        color: 'var(--ink)',
                        letterSpacing: '-0.02em',
                        lineHeight: 1,
                    }}
                >
                    {t('tabs.candidates')}
                </span>
                <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                    {t('candidates.countInfo', { filtered: filteredCount, total: bucketTotal })}
                </span>
                <RunningAgentsBadge running={runningAgents} onClick={onGoToAgents} />
                <div style={{ flex: 1 }} />
                {counts.lowScore > 0 && bucket === 'active' && (
                    <GhostBtn onClick={onCleanupLowScore}>
                        <span>{t('candidates.cleanupLowScore', { count: counts.lowScore })}</span>
                    </GhostBtn>
                )}
                <GhostBtn onClick={onGoToAgents}>
                    <span>{t('nav.agents')}</span>
                </GhostBtn>
            </div>

            <div style={{ display: 'flex', gap: 4, marginTop: 12 }}>
                <BucketTab
                    label={t('candidates.bucketActive')}
                    count={counts.active}
                    active={bucket === 'active'}
                    onClick={() => onBucketChange('active')}
                />
                <BucketTab
                    label={t('candidates.bucketIgnored')}
                    count={counts.ignored}
                    active={bucket === 'ignored'}
                    onClick={() => onBucketChange('ignored')}
                />
            </div>
        </div>
    );
}

function BucketTab({
    label,
    count,
    active,
    onClick,
}: {
    label: string;
    count: number;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            style={{
                border: '1px solid var(--rule)',
                background: active ? 'var(--ink)' : 'var(--paper)',
                color: active ? 'var(--paper)' : 'var(--ink-2)',
                padding: '4px 10px',
                fontSize: 11.5,
                fontFamily: 'var(--f-ui)',
                fontWeight: 500,
                letterSpacing: '0.01em',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
            }}
        >
            <span>{label}</span>
            <span
                className="mono"
                style={{
                    fontSize: 10,
                    opacity: 0.75,
                }}
            >
                {count}
            </span>
        </button>
    );
}
