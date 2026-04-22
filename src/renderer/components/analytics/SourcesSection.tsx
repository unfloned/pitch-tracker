import { useTranslation } from 'react-i18next';
import { Label } from '../primitives/Label';
import { SourceBar } from './SourceBar';
import type { AnalyticsData } from './useAnalyticsData';

export function SourcesSection({ data }: { data: AnalyticsData }) {
    const { t } = useTranslation();
    return (
        <div
            style={{
                padding: '22px 28px',
                borderRight: '1px solid var(--rule-strong)',
                borderBottom: '1px solid var(--rule-strong)',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 12,
                    marginBottom: 14,
                }}
            >
                <Label>Sources · what worked</Label>
                <div style={{ flex: 1 }} />
                <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>
                    <span
                        style={{
                            background: 'var(--ink-3)',
                            color: 'var(--paper)',
                            padding: '0 3px',
                        }}
                    >
                        applied
                    </span>
                    &nbsp;
                    <span
                        style={{
                            background: 'var(--moss)',
                            color: 'var(--paper)',
                            padding: '0 3px',
                        }}
                    >
                        offer
                    </span>
                </span>
            </div>
            {data.sources.length > 0 ? (
                <div>
                    {data.sources.map((s) => (
                        <SourceBar
                            key={s.src}
                            src={s.src}
                            apps={s.apps}
                            offers={s.offers}
                            maxApps={data.sourcesMax}
                        />
                    ))}
                </div>
            ) : (
                <div
                    style={{
                        padding: 18,
                        fontSize: 12,
                        color: 'var(--ink-4)',
                        textAlign: 'center',
                    }}
                >
                    {t('analytics.empty')}
                </div>
            )}
        </div>
    );
}
