import { UnstyledButton } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { ApplicationRecord } from '../../../../preload/index';
import { MatchScore } from '../../../components/primitives/MatchScore';
import { StageGlyph } from '../../../components/primitives/StageGlyph';
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
            <div
                style={{
                    background: 'var(--surface)',
                    borderRadius: 10,
                    boxShadow: 'var(--shadow-sm)',
                    padding: 6,
                }}
            >
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
                gap: 14,
                padding: '12px 14px',
                width: '100%',
                borderRadius: 8,
                background: 'transparent',
                transition: 'background 100ms',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--surface-2)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
            }}
        >
            <StageGlyph status={app.status} size={10} />
            <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <div
                    style={{
                        fontSize: 13.5,
                        color: 'var(--text)',
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
                        fontSize: 12,
                        color: 'var(--text-muted)',
                        marginTop: 2,
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
                    fontSize: 11,
                    color: 'var(--text-faint)',
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
