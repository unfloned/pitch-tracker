import { useTranslation } from 'react-i18next';
import { Label } from '../primitives/Label';
import type { AnalyticsData } from './useAnalyticsData';

export function WeeklyChart({ data }: { data: AnalyticsData }) {
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
                    marginBottom: 18,
                }}
            >
                <Label>{t('analytics.applicationsPerWeek')}</Label>
                <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)' }}>
                    last 12 weeks
                </span>
                <div style={{ flex: 1 }} />
                <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-2)' }}>
                    ▮ sent &nbsp;&nbsp; ▮ this week
                </span>
            </div>
            <div
                style={{
                    height: 180,
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: 6,
                    padding: '0 4px',
                }}
            >
                {data.weekly.map((w, i) => (
                    <div
                        key={i}
                        style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 6,
                        }}
                    >
                        <span
                            className="mono tnum"
                            style={{ fontSize: 10, color: 'var(--ink-3)' }}
                        >
                            {w.count}
                        </span>
                        <div
                            style={{
                                width: '100%',
                                height: `${(w.count / data.weeklyMax) * 140}px`,
                                minHeight: w.count > 0 ? 2 : 0,
                                background: w.isCurrent ? 'var(--accent)' : 'var(--ink)',
                            }}
                        />
                        <span className="mono" style={{ fontSize: 9, color: 'var(--ink-4)' }}>
                            W{w.week}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
