import type { ApplicationRecord } from '../../preload/index';
import { FunnelSection } from '../modules/analytics/components/FunnelSection';
import { KpiStrip } from '../modules/analytics/components/KpiStrip';
import { Masthead } from '../modules/analytics/components/Masthead';
import { ObservationsStrip } from '../modules/analytics/components/ObservationsStrip';
import { PipelineSection } from '../modules/analytics/components/PipelineSection';
import { SourcesSection } from '../modules/analytics/components/SourcesSection';
import { StageTransitions } from '../modules/analytics/components/StageTransitions';
import { WeeklyChart } from '../modules/analytics/components/WeeklyChart';
import { useAnalyticsData } from '../modules/analytics/components/useAnalyticsData';

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
