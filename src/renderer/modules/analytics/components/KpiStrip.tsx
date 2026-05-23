import { useTranslation } from 'react-i18next';
import type { AnalyticsData } from './useAnalyticsData';
import { KPI } from './KPI';

export function KpiStrip({ data }: { data: AnalyticsData }) {
    const { t } = useTranslation();
    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                borderBottom: '1px solid var(--rule-strong)',
            }}
        >
            <KPI
                label={t('analytics.totalApplications')}
                value={data.total}
                sub={`${data.applied} sent`}
            />
            <KPI
                label={t('analytics.activeApplications')}
                value={data.active}
                sub="in motion"
                tone="accent"
            />
            <KPI
                label={t('analytics.avgMatchScore')}
                value={data.avgMatch || '—'}
                sub={data.scored.length ? `${data.scored.length} scored` : 'no scores yet'}
            />
            <KPI
                label={t('analytics.offersReceived')}
                value={data.offers}
                sub={`${data.offerRate}% rate`}
                tone={data.offers > 0 ? 'moss' : undefined}
            />
            <KPI
                label="Events · this week"
                value={data.eventsThisWeek}
                sub={data.eventsThisWeek > 0 ? 'stage changes' : 'no movement'}
                tone={data.eventsThisWeek > 0 ? 'accent' : undefined}
            />
        </div>
    );
}
