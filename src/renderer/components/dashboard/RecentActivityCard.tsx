import { UnstyledButton } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { ApplicationRecord } from '../../../preload/index';
import { MatchScore } from '../primitives/MatchScore';
import { StageGlyph } from '../primitives/StageGlyph';
import { SectionHeader } from './SectionHeader';

interface Props {
    items: ApplicationRecord[];
    onOpenApplication: (app: ApplicationRecord) => void;
}

/** Latest-updated applications, 6 at most, click opens in the split-view. */
export function RecentActivityCard({ items, onOpenApplication }: Props) {
    const { t } = useTranslation();

    if (items.length === 0) return null;

    return (
        <div>
            <SectionHeader title={t('dashboard.sectionActivity')} />
            <div style={{ border: '1px solid var(--rule)', background: 'var(--card)' }}>
                {items.map((app) => (
                    <ActivityRow key={app.id} app={app} onClick={() => onOpenApplication(app)} />
                ))}
            </div>
        </div>
    );
}

function ActivityRow({
    app,
    onClick,
}: {
    app: ApplicationRecord;
    onClick: () => void;
}) {
    return (
        <UnstyledButton
            onClick={onClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                width: '100%',
                borderBottom: '1px solid var(--rule)',
                background: 'transparent',
                transition: 'background 80ms',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--paper-2)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
            }}
        >
            <StageGlyph status={app.status} size={10} />
            <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <div
                    style={{
                        fontSize: 13,
                        color: 'var(--ink)',
                        fontWeight: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {app.companyName || '—'}
                </div>
                <div
                    style={{
                        fontSize: 11,
                        color: 'var(--ink-3)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {app.jobTitle || '—'}
                </div>
            </div>
            {app.matchScore > 0 && (
                <MatchScore value={app.matchScore} width={36} showValue={false} />
            )}
            <span
                className="mono"
                style={{
                    fontSize: 10,
                    color: 'var(--ink-3)',
                    letterSpacing: '0.02em',
                    minWidth: 70,
                    textAlign: 'right',
                }}
            >
                {new Date(app.updatedAt).toLocaleDateString()}
            </span>
        </UnstyledButton>
    );
}
