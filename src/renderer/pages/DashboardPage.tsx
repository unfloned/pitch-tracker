import type { ApplicationRecord } from '../../preload/index';
import { ActionsCard } from '../components/dashboard/ActionsCard';
import { DashboardMasthead } from '../components/dashboard/DashboardMasthead';
import { EmptyState } from '../components/dashboard/EmptyState';
import { RecentActivityCard } from '../components/dashboard/RecentActivityCard';
import { StatsCard } from '../components/dashboard/StatsCard';
import type { PageKey } from '../components/dashboard/types';
import { useDashboardData } from '../components/dashboard/useDashboardData';

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
