import type { ApplicationRecord } from '../../preload/index';
import { FunnelSection } from '../components/analytics/FunnelSection';
import { KpiStrip } from '../components/analytics/KpiStrip';
import { Masthead } from '../components/analytics/Masthead';
import { ObservationsStrip } from '../components/analytics/ObservationsStrip';
import { PipelineSection } from '../components/analytics/PipelineSection';
import { SourcesSection } from '../components/analytics/SourcesSection';
import { StageTransitions } from '../components/analytics/StageTransitions';
import { WeeklyChart } from '../components/analytics/WeeklyChart';
import { useAnalyticsData } from '../components/analytics/useAnalyticsData';

interface Props {
    applications: ApplicationRecord[];
}

/**
 * Newspaper-style analytics report. Computes everything in useAnalyticsData
 * and hands the data object to each section. Layout: masthead → KPI strip →
 * 2-column body (weekly/funnel, sources/pipeline) → full-width transitions →
 * dark observations strip.
 */
export function AnalyticsPage({ applications }: Props) {
    const data = useAnalyticsData(applications);

    return (
        <div style={{ flex: 1, overflow: 'auto', background: 'var(--paper)' }}>
            <Masthead now={data.now} />
            <KpiStrip data={data} />

            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 0 }}>
                <WeeklyChart data={data} />
                <FunnelSection data={data} />
                <SourcesSection data={data} />
                <PipelineSection data={data} />
                <StageTransitions data={data} />
                <ObservationsStrip data={data} />
            </div>
        </div>
    );
}
