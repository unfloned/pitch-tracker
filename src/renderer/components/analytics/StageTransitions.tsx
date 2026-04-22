import { Label } from '../primitives/Label';
import type { AnalyticsData } from './useAnalyticsData';

/** Full-width "median days between stages" strip. */
export function StageTransitions({ data }: { data: AnalyticsData }) {
    return (
        <div
            style={{
                gridColumn: '1 / 3',
                padding: '22px 28px',
                borderBottom: '1px solid var(--rule-strong)',
                background: 'var(--paper)',
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
                <Label>Stage transitions · from your history</Label>
                <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)' }}>
                    median days · sample size
                </span>
            </div>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: 0,
                    border: '1px solid var(--rule)',
                }}
            >
                {data.transitions.map((tr, i) => (
                    <div
                        key={tr.label}
                        style={{
                            padding: '14px 16px',
                            borderRight:
                                i < data.transitions.length - 1
                                    ? '1px solid var(--rule)'
                                    : 'none',
                            background: tr.count > 0 ? 'var(--card)' : 'transparent',
                        }}
                    >
                        <span
                            className="mono"
                            style={{
                                fontSize: 10,
                                color: 'var(--ink-4)',
                                letterSpacing: '0.06em',
                                textTransform: 'uppercase',
                            }}
                        >
                            {tr.label}
                        </span>
                        <div
                            className="serif tnum"
                            style={{
                                fontSize: 28,
                                fontWeight: 500,
                                color: tr.count > 0 ? 'var(--ink)' : 'var(--ink-4)',
                                letterSpacing: '-0.02em',
                                lineHeight: 1,
                                marginTop: 6,
                            }}
                        >
                            {tr.count > 0 ? tr.median.toFixed(1) : '—'}
                            {tr.count > 0 && (
                                <span
                                    style={{
                                        fontSize: 13,
                                        color: 'var(--ink-3)',
                                        marginLeft: 4,
                                    }}
                                >
                                    d
                                </span>
                            )}
                        </div>
                        <span
                            className="mono"
                            style={{
                                fontSize: 10,
                                color: 'var(--ink-3)',
                                marginTop: 4,
                                display: 'inline-block',
                            }}
                        >
                            n={tr.count}
                        </span>
                    </div>
                ))}
            </div>
            {data.events.length === 0 && (
                <div
                    className="serif"
                    style={{
                        marginTop: 12,
                        fontSize: 13,
                        fontStyle: 'italic',
                        color: 'var(--ink-3)',
                    }}
                >
                    History fills in as you update application statuses. Every stage change is
                    logged locally from now on.
                </div>
            )}
        </div>
    );
}
