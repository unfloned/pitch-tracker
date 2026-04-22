import { useEffect, useMemo, useState } from 'react';
import type { ApplicationStatus } from '@shared/application';
import type { ApplicationEvent, ApplicationRecord } from '../../../preload/index';
import { ACTIVE_STATUSES } from './constants';
import { isoWeek, stageShort, startOfWeek } from './utils';

export interface AnalyticsData {
    total: number;
    active: number;
    applied: number;
    scored: ApplicationRecord[];
    avgMatch: number;
    offers: number;
    interviews: number;
    offerRate: string;
    weekly: WeekBucket[];
    weeklyMax: number;
    transitions: TransitionStat[];
    eventsThisWeek: number;
    funnel: FunnelEntry[];
    sources: SourceStat[];
    sourcesMax: number;
    pipeline: PipelineSegment[];
    pipelineTotal: number;
    remote: RemoteShare[];
    matchDist: number[];
    matchMax: number;
    events: ApplicationEvent[];
    now: Date;
}

interface WeekBucket {
    week: number;
    count: number;
    isCurrent: boolean;
}

interface TransitionStat {
    label: string;
    median: number;
    count: number;
}

interface FunnelEntry {
    label: string;
    n: number;
    peak?: boolean;
}

interface SourceStat {
    src: string;
    apps: number;
    offers: number;
}

interface PipelineSegment {
    k: string;
    n: number;
    color: string;
}

interface RemoteShare {
    label: string;
    v: number;
    color: string;
}

/**
 * All derived numbers for the Analytics page. Fetches the full event log on
 * mount (keyed off `applications.length` so adding a row refreshes), then
 * memoises everything — weekly buckets, stage-transition medians, source
 * attribution, funnel, pipeline, remote mix, match distribution.
 */
export function useAnalyticsData(applications: ApplicationRecord[]): AnalyticsData {
    const now = new Date();
    const [events, setEvents] = useState<ApplicationEvent[]>([]);

    useEffect(() => {
        let cancelled = false;
        window.api.applications.events.list().then((list) => {
            if (!cancelled) setEvents(list);
        });
        return () => {
            cancelled = true;
        };
    }, [applications.length]);

    const total = applications.length;
    const active = applications.filter((a) => ACTIVE_STATUSES.includes(a.status)).length;
    const scored = applications.filter((a) => a.matchScore > 0);
    const avgMatch = scored.length
        ? Math.round(scored.reduce((s, a) => s + a.matchScore, 0) / scored.length)
        : 0;
    const offers = applications.filter(
        (a) => a.status === 'offer_received' || a.status === 'accepted',
    ).length;
    const interviews = applications.filter(
        (a) => a.status === 'interview_scheduled' || a.status === 'interviewed',
    ).length;
    const applied = applications.filter((a) => a.status !== 'draft').length;
    const offerRate = applied > 0 ? ((offers / applied) * 100).toFixed(1) : '0.0';

    // 12-week bars, keyed off "applied" transitions from the event log.
    const weekly = useMemo<WeekBucket[]>(() => {
        const twelveWeeksAgo = startOfWeek(new Date(now.getTime() - 12 * 7 * 86400000));
        const thisWeek = startOfWeek(now).getTime();
        const buckets: WeekBucket[] = [];
        for (let i = 0; i < 12; i++) {
            const weekStart = new Date(twelveWeeksAgo.getTime() + i * 7 * 86400000);
            buckets.push({
                week: isoWeek(weekStart),
                count: 0,
                isCurrent: weekStart.getTime() === thisWeek,
            });
        }
        for (const ev of events) {
            if (ev.toStatus !== 'applied') continue;
            const changed = new Date(ev.changedAt);
            if (changed < twelveWeeksAgo) continue;
            const idx = Math.floor(
                (startOfWeek(changed).getTime() - twelveWeeksAgo.getTime()) /
                    (7 * 86400000),
            );
            if (idx >= 0 && idx < 12) buckets[idx].count++;
        }
        return buckets;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [events]);

    const weeklyMax = Math.max(1, ...weekly.map((w) => w.count));

    // Median days between consecutive stages across all applications.
    const transitions = useMemo<TransitionStat[]>(() => {
        const byApp = new Map<string, ApplicationEvent[]>();
        for (const ev of events) {
            const list = byApp.get(ev.applicationId) ?? [];
            list.push(ev);
            byApp.set(ev.applicationId, list);
        }
        const pairs: [ApplicationStatus, ApplicationStatus][] = [
            ['applied', 'in_review'],
            ['applied', 'interview_scheduled'],
            ['interview_scheduled', 'interviewed'],
            ['interviewed', 'offer_received'],
            ['offer_received', 'accepted'],
        ];
        const results: TransitionStat[] = [];
        for (const [from, to] of pairs) {
            const deltas: number[] = [];
            for (const [, list] of byApp) {
                const fromEv = list.find((e) => e.toStatus === from);
                const toEv = list.find((e) => e.toStatus === to);
                if (fromEv && toEv) {
                    const d =
                        new Date(toEv.changedAt).getTime() -
                        new Date(fromEv.changedAt).getTime();
                    if (d > 0) deltas.push(d / 86400000);
                }
            }
            deltas.sort((a, b) => a - b);
            const median = deltas.length
                ? deltas.length % 2
                    ? deltas[(deltas.length - 1) / 2]
                    : (deltas[deltas.length / 2 - 1] + deltas[deltas.length / 2]) / 2
                : 0;
            results.push({
                label: `${stageShort(from)} → ${stageShort(to)}`,
                median,
                count: deltas.length,
            });
        }
        return results;
    }, [events]);

    const eventsThisWeek = useMemo(() => {
        const weekStart = startOfWeek(now).getTime();
        return events.filter(
            (e) => new Date(e.changedAt).getTime() >= weekStart && e.fromStatus !== null,
        ).length;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [events]);

    const funnel: FunnelEntry[] = [
        { label: 'Drafted', n: applications.length },
        { label: 'Applied', n: applied },
        {
            label: 'In review',
            n: applications.filter(
                (a) =>
                    a.status === 'in_review' ||
                    a.status === 'interview_scheduled' ||
                    a.status === 'interviewed' ||
                    a.status === 'offer_received' ||
                    a.status === 'accepted',
            ).length,
        },
        {
            label: 'Interview',
            n:
                interviews +
                applications.filter(
                    (a) => a.status === 'offer_received' || a.status === 'accepted',
                ).length,
            peak: true,
        },
        { label: 'Offer', n: offers },
        {
            label: 'Accepted',
            n: applications.filter((a) => a.status === 'accepted').length,
        },
    ];

    const sources = useMemo<SourceStat[]>(() => {
        const bySource = new Map<string, { apps: number; offers: number }>();
        for (const a of applications) {
            const src = a.source?.trim() || 'direct';
            const entry = bySource.get(src) ?? { apps: 0, offers: 0 };
            entry.apps++;
            if (a.status === 'offer_received' || a.status === 'accepted') entry.offers++;
            bySource.set(src, entry);
        }
        return Array.from(bySource.entries())
            .map(([src, v]) => ({ src, ...v }))
            .sort((a, b) => b.apps - a.apps)
            .slice(0, 8);
    }, [applications]);

    const sourcesMax = Math.max(1, ...sources.map((s) => s.apps));

    const pipeline = useMemo<PipelineSegment[]>(() => {
        const counts: Record<ApplicationStatus, number> = {
            draft: 0,
            applied: 0,
            in_review: 0,
            interview_scheduled: 0,
            interviewed: 0,
            offer_received: 0,
            accepted: 0,
            rejected: 0,
            withdrawn: 0,
        };
        for (const a of applications) counts[a.status]++;
        return [
            { k: 'Draft', n: counts.draft, color: 'var(--ink-4)' },
            { k: 'Applied', n: counts.applied, color: 'var(--accent)' },
            { k: 'Review', n: counts.in_review, color: 'var(--accent)' },
            {
                k: 'Interview',
                n: counts.interview_scheduled + counts.interviewed,
                color: 'var(--rust)',
            },
            {
                k: 'Offer',
                n: counts.offer_received + counts.accepted,
                color: 'var(--moss)',
            },
        ].filter((s) => s.n > 0);
    }, [applications]);

    const pipelineTotal = pipeline.reduce((a, b) => a + b.n, 0);

    const remote = useMemo<RemoteShare[]>(() => {
        const counts = { onsite: 0, hybrid: 0, remote: 0 } as Record<string, number>;
        for (const a of applications) counts[a.remote] = (counts[a.remote] ?? 0) + 1;
        const totalRem = counts.onsite + counts.hybrid + counts.remote;
        return [
            {
                label: 'Remote',
                v: totalRem ? Math.round((counts.remote / totalRem) * 100) : 0,
                color: 'var(--ink-2)',
            },
            {
                label: 'Hybrid',
                v: totalRem ? Math.round((counts.hybrid / totalRem) * 100) : 0,
                color: 'var(--ink-3)',
            },
            {
                label: 'Vor Ort',
                v: totalRem ? Math.round((counts.onsite / totalRem) * 100) : 0,
                color: 'var(--paper-3)',
            },
        ];
    }, [applications]);

    const matchDist = useMemo(() => {
        const buckets = Array<number>(11).fill(0);
        for (const a of applications) {
            if (a.matchScore <= 0) continue;
            const idx = Math.min(10, Math.floor(a.matchScore / 10));
            buckets[idx]++;
        }
        return buckets;
    }, [applications]);

    const matchMax = Math.max(1, ...matchDist);

    return {
        total,
        active,
        applied,
        scored,
        avgMatch,
        offers,
        interviews,
        offerRate,
        weekly,
        weeklyMax,
        transitions,
        eventsThisWeek,
        funnel,
        sources,
        sourcesMax,
        pipeline,
        pipelineTotal,
        remote,
        matchDist,
        matchMax,
        events,
        now,
    };
}
