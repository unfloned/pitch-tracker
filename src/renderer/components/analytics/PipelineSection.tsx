import { useTranslation } from 'react-i18next';
import { Label } from '../primitives/Label';
import type { AnalyticsData } from './useAnalyticsData';

/**
 * Right-column block combining three small charts: pipeline breakdown by
 * stage, remote/hybrid/onsite share, and match-score distribution histogram.
 */
export function PipelineSection({ data }: { data: AnalyticsData }) {
    const { t } = useTranslation();
    return (
        <div style={{ padding: '22px 28px', borderBottom: '1px solid var(--rule-strong)' }}>
            <Label>Current pipeline · by stage</Label>
            {data.pipelineTotal > 0 ? (
                <>
                    <div style={{ display: 'flex', gap: 2, marginTop: 14, height: 22 }}>
                        {data.pipeline.map((s) => (
                            <div
                                key={s.k}
                                style={{
                                    flex: s.n,
                                    background: s.color,
                                    position: 'relative',
                                }}
                            >
                                <span
                                    className="mono"
                                    style={{
                                        position: 'absolute',
                                        left: 4,
                                        top: 4,
                                        fontSize: 10,
                                        fontWeight: 600,
                                        color: 'var(--paper)',
                                    }}
                                >
                                    {s.n}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: 2, marginTop: 6 }}>
                        {data.pipeline.map((s) => (
                            <div key={s.k} style={{ flex: s.n }}>
                                <Label>{s.k}</Label>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div style={{ padding: 18, fontSize: 12, color: 'var(--ink-4)' }}>
                    {t('analytics.empty')}
                </div>
            )}

            <div style={{ marginTop: 22 }}>
                <Label>Remote · Hybrid · Vor Ort</Label>
                <div style={{ display: 'flex', marginTop: 10, height: 28 }}>
                    {data.remote.map((r) => (
                        <div
                            key={r.label}
                            style={{
                                flex: Math.max(0.01, r.v),
                                background: r.color,
                                display: 'flex',
                                alignItems: 'center',
                                padding: '0 8px',
                                minWidth: r.v > 0 ? 40 : 0,
                            }}
                        >
                            <span
                                style={{
                                    fontSize: 11,
                                    color:
                                        r.color === 'var(--paper-3)'
                                            ? 'var(--ink-2)'
                                            : 'var(--paper)',
                                    fontWeight: 600,
                                }}
                            >
                                {r.label}
                            </span>
                            <div style={{ flex: 1 }} />
                            <span
                                className="mono tnum"
                                style={{
                                    fontSize: 10,
                                    color:
                                        r.color === 'var(--paper-3)'
                                            ? 'var(--ink-3)'
                                            : 'var(--paper-2)',
                                }}
                            >
                                {r.v}%
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ marginTop: 22 }}>
                <Label>Match distribution</Label>
                {data.scored.length > 0 ? (
                    <>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'flex-end',
                                height: 60,
                                gap: 3,
                                marginTop: 10,
                            }}
                        >
                            {data.matchDist.map((n, i) => (
                                <div
                                    key={i}
                                    style={{
                                        flex: 1,
                                        height: `${(n / data.matchMax) * 54}px`,
                                        minHeight: n > 0 ? 2 : 0,
                                        background:
                                            i >= 7
                                                ? 'var(--moss)'
                                                : i >= 4
                                                  ? 'var(--ink-2)'
                                                  : 'var(--paper-3)',
                                    }}
                                />
                            ))}
                        </div>
                        <div
                            className="mono"
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: 9.5,
                                color: 'var(--ink-4)',
                                marginTop: 4,
                            }}
                        >
                            <span>0</span>
                            <span>50</span>
                            <span>100</span>
                        </div>
                    </>
                ) : (
                    <div
                        style={{
                            padding: 12,
                            fontSize: 12,
                            color: 'var(--ink-4)',
                            marginTop: 10,
                        }}
                    >
                        {t('analytics.matchDistributionEmpty')}
                    </div>
                )}
            </div>
        </div>
    );
}
