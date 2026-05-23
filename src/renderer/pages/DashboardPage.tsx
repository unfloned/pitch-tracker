import type { ApplicationRecord } from '../../preload/index';
import { ActionsCard } from '../modules/dashboard/components/ActionsCard';
import { DashboardMasthead } from '../modules/dashboard/components/DashboardMasthead';
import { EmptyState } from '../modules/dashboard/components/EmptyState';
import { RecentActivityCard } from '../modules/dashboard/components/RecentActivityCard';
import { StatsCard } from '../modules/dashboard/components/StatsCard';
import type { PageKey } from '../modules/dashboard/components/types';
import { useDashboardData } from '../modules/dashboard/components/useDashboardData';

interface Props {
    applications: ApplicationRecord[];
    onNavigate: (page: PageKey) => void;
    onNewEntry: () => void;
    onQuickAdd: () => void;
    onExport: () => void;
    onOpenApplication: (app: ApplicationRecord) => void;
}

/**
 * Inbox / Dashboard landing page. Composes its body from the dashboard/
 * sub-components. Data aggregation lives in useDashboardData.
 */
export function DashboardPage({
    applications,
    onNavigate,
    onNewEntry,
    onOpenApplication,
}: Props) {
    const data = useDashboardData(applications);

    if (applications.length === 0 && data.candidates.length === 0) {
        return <EmptyState onNewEntry={onNewEntry} onGoToAgents={() => onNavigate('agents')} />;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <DashboardMasthead />

            <ActionsCard
                actionCount={data.actionCount}
                pendingOffers={data.pendingOffers}
                interviewsSoon={data.interviewsSoon}
                followUps={data.followUps}
                topCandidates={data.topCandidates}
                onOpenApplication={onOpenApplication}
                onNavigate={onNavigate}
            />

            <StatsCard
                total={data.total}
                applied={data.applied}
                interviewing={data.interviewing}
                accepted={data.accepted}
                avgMatch={data.avgMatch}
                onNavigate={onNavigate}
            />

            <RecentActivityCard
                items={data.recentActivity}
                onOpenApplication={onOpenApplication}
            />
        </div>
    );
}
