import { useEffect, useMemo, useState } from 'react';
import type { ApplicationRecord } from '../../../preload/index';
import type { SerializedJobCandidate } from '@shared/job-search';

export interface DashboardData {
    total: number;
    applied: number;
    interviewing: number;
    accepted: number;
    avgMatch: number;
    followUps: ApplicationRecord[];
    pendingOffers: ApplicationRecord[];
    interviewsSoon: ApplicationRecord[];
    topCandidates: SerializedJobCandidate[];
    actionCount: number;
    candidates: SerializedJobCandidate[];
    recentActivity: ApplicationRecord[];
}

/**
 * Aggregates everything the Dashboard page renders: stats, buckets for the
 * Today list, recent activity ordering. Candidates are fetched lazily on
 * mount; applications come in from the parent as a prop.
 */
export function useDashboardData(applications: ApplicationRecord[]): DashboardData {
    const [candidates, setCandidates] = useState<SerializedJobCandidate[]>([]);

    useEffect(() => {
        window.api.agents
            .listCandidates(0)
            .then(setCandidates)
            .catch(() => {});
    }, []);

    return useMemo(() => {
        const total = applications.length;
        const applied = applications.filter((a) => a.status === 'applied').length;
        const interviewing = applications.filter(
            (a) =>
                a.status === 'interview_scheduled' ||
                a.status === 'interviewed' ||
                a.status === 'offer_received',
        ).length;
        const accepted = applications.filter((a) => a.status === 'accepted').length;
        const scored = applications.filter((a) => a.matchScore > 0);
        const avgMatch =
            scored.length > 0
                ? Math.round(scored.reduce((s, a) => s + a.matchScore, 0) / scored.length)
                : 0;

        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const followUps = applications.filter(
            (a) =>
                a.status === 'applied' &&
                a.appliedAt &&
                new Date(a.appliedAt).getTime() < sevenDaysAgo,
        );

        const pendingOffers = applications.filter((a) => a.status === 'offer_received');
        const interviewsSoon = applications.filter(
            (a) => a.status === 'interview_scheduled' || a.status === 'interviewed',
        );

        const newCandidates = candidates.filter((c) => c.status === 'new').slice(0, 5);
        const topCandidates = [...newCandidates].sort((a, b) => b.score - a.score);

        const actionCount =
            followUps.length +
            pendingOffers.length +
            interviewsSoon.length +
            newCandidates.length;

        const recentActivity = [...applications]
            .sort(
                (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
            )
            .slice(0, 6);

        return {
            total,
            applied,
            interviewing,
            accepted,
            avgMatch,
            followUps,
            pendingOffers,
            interviewsSoon,
            topCandidates,
            actionCount,
            candidates,
            recentActivity,
        };
    }, [applications, candidates]);
}
