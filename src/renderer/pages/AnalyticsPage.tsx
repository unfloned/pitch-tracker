import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ApplicationStatus } from '@shared/application';
import type { ApplicationEvent, ApplicationRecord } from '../../preload/index';
import { GhostBtn } from '../components/primitives/GhostBtn';
import { Kbd } from '../components/primitives/Kbd';
import { Label } from '../components/primitives/Label';

interface Props {
    applications: ApplicationRecord[];
}

const STAGE_ORDER: ApplicationStatus[] = [
    'draft',
    'applied',
    'in_review',
    'interview_scheduled',
    'interviewed',
    'offer_received',
    'accepted',
];

function STAGE_SHORT(s: ApplicationStatus): string {
    return {
        draft: 'Draft',
        applied: 'Applied',
        in_review: 'Review',
        interview_scheduled: 'Interview',
        interviewed: 'Post-Int',
        offer_received: 'Offer',
        accepted: 'Accepted',
        rejected: 'Rejected',
        withdrawn: 'Withdrawn',
    }[s];
}

function startOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = (day + 6) % 7;
    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

function isoWeek(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

const ACTIVE_STATUSES: ApplicationStatus[] = [
    'applied',
    'in_review',
    'interview_scheduled',
    'interviewed',
    'offer_received',
];

function KPI({
    label,
    value,
    sub,
    tone,
    unit,
}: {
    label: string;
    value: string | number;
    sub?: string;
    tone?: 'accent' | 'moss' | 'rust';
    unit?: string;
}) {
    const subBg =
        tone === 'moss'
            ? 'var(--moss)'
            : tone === 'rust'
              ? 'var(--rust)'
              : tone === 'accent'
                ? 'var(--accent-ink)'
                : 'var(--paper-2)';
    const subColor = tone ? 'var(--paper)' : 'var(--ink-2)';
    return (
        <div style={{ padding: '18px 18px', borderRight: '1px solid var(--rule)' }}>
            <Label>{label}</Label>
            <div
                className="serif tnum"
                style={{
                    fontSize: 42,
                    fontWeight: 500,
                    color: 'var(--ink)',
                    letterSpacing: '-0.02em',
                    lineHeight: 1,
                    marginTop: 10,
                }}
            >
                {value}
                {unit && (
                    <span
                        style={{
                            fontSize: 20,
                            color: 'var(--ink-3)',
                            marginLeft: 4,
                        }}
                    >
                        {unit}
                    </span>
                )}
            </div>
            {sub && (
                <div style={{ marginTop: 8 }}>
                    <span
                        className="mono"
                        style={{
                            padding: '1px 5px',
                            fontSize: 10,
                            fontWeight: 600,
                            background: subBg,
                            color: subColor,
                        }}
                    >
                        {sub}
                    </span>
                </div>
            )}
        </div>
    );
}

function FunnelStep({
    label,
    n,
    total,
    peak,
}: {
    label: string;
    n: number;
    total: number;
    peak?: boolean;
}) {
    const pct = total > 0 ? (n / total) * 100 : 0;
    const width = Math.max(1.5, Math.min(100, pct));
    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: '110px 1fr 60px 50px',
                gap: 10,
                alignItems: 'center',
                padding: '7px 0',
            }}
        >
            <span style={{ fontSize: 12.5, color: 'var(--ink-2)', fontWeight: 500 }}>{label}</span>
            <div style={{ height: 18, background: 'var(--paper-3)', position: 'relative' }}>
                <div
                    style={{
                        height: '100%',
                        width: `${width}%`,
                        background: peak ? 'var(--accent)' : 'var(--ink-2)',
                    }}
                />
            </div>
            <span
                className="mono tnum"
                style={{
                    fontSize: 12,
                    color: 'var(--ink-2)',
                    fontWeight: 500,
                    textAlign: 'right',
                }}
            >
                {n}
            </span>
            <span
                className="mono tnum"
                style={{ fontSize: 10.5, color: 'var(--ink-4)', textAlign: 'right' }}
            >
                {pct.toFixed(1)}%
            </span>
        </div>
    );
}

function SourceBar({
    src,
    apps,
    offers,
    maxApps,
}: {
    src: string;
    apps: number;
    offers: number;
    maxApps: number;
}) {
    const width = (apps / maxApps) * 100;
    const offWidth = apps > 0 && offers ? (offers / apps) * width : 0;
    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: '160px 1fr 48px 36px',
                gap: 10,
                alignItems: 'center',
                padding: '6px 0',
                borderBottom: '1px dashed var(--rule)',
            }}
        >
            <span
                className="mono"
                style={{ fontSize: 11, color: 'var(--ink-2)', letterSpacing: '0.02em' }}
            >
                {src}
            </span>
            <div style={{ height: 10, position: 'relative', background: 'var(--paper-3)' }}>
                <div
                    style={{ height: '100%', width: `${width}%`, background: 'var(--ink-3)' }}
                />
                <div
                    style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        height: '100%',
                        width: `${offWidth}%`,
                        background: 'var(--moss)',
                    }}
                />
            </div>
            <span
                className="mono tnum"
                style={{ fontSize: 11, color: 'var(--ink-2)', textAlign: 'right' }}
            >
                {apps}
            </span>
            <span
                className="mono tnum"
                style={{
                    fontSize: 11,
                    color: offers ? 'var(--moss)' : 'var(--ink-4)',
                    fontWeight: offers ? 600 : 400,
                    textAlign: 'right',
                }}
            >
                {offers || '—'}
            </span>
        </div>
    );
}

export function AnalyticsPage({ applications }: Props) {
    const { t } = useTranslation();
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

    // weekly "applied" events — from status history, not createdAt
    const weekly = useMemo(() => {
        const twelveWeeksAgo = startOfWeek(new Date(now.getTime() - 12 * 7 * 86400000));
        const buckets: { week: number; count: number; isCurrent: boolean }[] = [];
        const thisWeek = startOfWeek(now).getTime();
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
                (startOfWeek(changed).getTime() - twelveWeeksAgo.getTime()) / (7 * 86400000),
            );
            if (idx >= 0 && idx < 12) buckets[idx].count++;
        }
        return buckets;
    }, [events]);

    // Stage transitions — median days between consecutive stages across apps
    const transitions = useMemo(() => {
        // Group events per application
        const byApp = new Map<string, ApplicationEvent[]>();
        for (const ev of events) {
            const list = byApp.get(ev.applicationId) ?? [];
            list.push(ev);
            byApp.set(ev.applicationId, list);
        }
        // For each app, find time-to-stage values
        const pairs: [ApplicationStatus, ApplicationStatus][] = [
            ['applied', 'in_review'],
            ['applied', 'interview_scheduled'],
            ['interview_scheduled', 'interviewed'],
            ['interviewed', 'offer_received'],
            ['offer_received', 'accepted'],
        ];
        const results: { label: string; median: number; count: number }[] = [];
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
                label: `${STAGE_SHORT(from)} → ${STAGE_SHORT(to)}`,
                median,
                count: deltas.length,
            });
        }
        return results;
    }, [events]);

    // Total transitions this week (movement indicator)
    const eventsThisWeek = useMemo(() => {
        const weekStart = startOfWeek(now).getTime();
        return events.filter(
            (e) =>
                new Date(e.changedAt).getTime() >= weekStart && e.fromStatus !== null,
        ).length;
    }, [events]);

    const weeklyMax = Math.max(1, ...weekly.map((w) => w.count));

    // funnel
    const funnel = [
        { label: 'Drafted', n: applications.length },
        { label: 'Applied', n: applied },
        { label: 'In review', n: applications.filter((a) => a.status === 'in_review' || a.status === 'interview_scheduled' || a.status === 'interviewed' || a.status === 'offer_received' || a.status === 'accepted').length },
        { label: 'Interview', n: interviews + applications.filter((a) => a.status === 'offer_received' || a.status === 'accepted').length, peak: true as const },
        { label: 'Offer', n: offers },
        { label: 'Accepted', n: applications.filter((a) => a.status === 'accepted').length },
    ];

    // sources — derive from source field
    const sources = useMemo(() => {
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

    // pipeline strip
    const pipeline = useMemo(() => {
        const counts: Record<ApplicationStatus, number> = {
            draft: 0, applied: 0, in_review: 0, interview_scheduled: 0, interviewed: 0,
            offer_received: 0, accepted: 0, rejected: 0, withdrawn: 0,
        };
        for (const a of applications) counts[a.status]++;
        return [
            { k: 'Draft',     n: counts.draft,                color: 'var(--ink-4)' },
            { k: 'Applied',   n: counts.applied,              color: 'var(--accent)' },
            { k: 'Review',    n: counts.in_review,            color: 'var(--accent)' },
            { k: 'Interview', n: counts.interview_scheduled + counts.interviewed, color: 'var(--rust)' },
            { k: 'Offer',     n: counts.offer_received + counts.accepted,         color: 'var(--moss)' },
        ].filter((s) => s.n > 0);
    }, [applications]);
    const pipelineTotal = pipeline.reduce((a, b) => a + b.n, 0);

    // remote mix
    const remote = useMemo(() => {
        const counts = { onsite: 0, hybrid: 0, remote: 0 } as Record<string, number>;
        for (const a of applications) counts[a.remote] = (counts[a.remote] ?? 0) + 1;
        const totalRem = counts.onsite + counts.hybrid + counts.remote;
        return [
            { label: 'Remote', v: totalRem ? Math.round((counts.remote / totalRem) * 100) : 0, color: 'var(--ink-2)' },
            { label: 'Hybrid', v: totalRem ? Math.round((counts.hybrid / totalRem) * 100) : 0, color: 'var(--ink-3)' },
            { label: 'Vor Ort', v: totalRem ? Math.round((counts.onsite / totalRem) * 100) : 0, color: 'var(--paper-3)' },
        ];
    }, [applications]);

    // match distribution
    const matchDist = useMemo(() => {
        const buckets = Array(11).fill(0);
        for (const a of applications) {
            if (a.matchScore <= 0) continue;
            const idx = Math.min(10, Math.floor(a.matchScore / 10));
            buckets[idx]++;
        }
        return buckets;
    }, [applications]);
    const matchMax = Math.max(1, ...matchDist);

    return (
        <div style={{ flex: 1, overflow: 'auto', background: 'var(--paper)' }}>
            {/* masthead */}
            <div
                style={{
                    padding: '22px 28px 14px',
                    borderBottom: '2px solid var(--ink)',
                    background: 'var(--paper)',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'space-between',
                    }}
                >
                    <div>
                        <Label>{t('analytics.title')} · Report</Label>
                        <div
                            className="serif"
                            style={{
                                fontSize: 36,
                                fontWeight: 500,
                                color: 'var(--ink)',
                                letterSpacing: '-0.02em',
                                marginTop: 4,
                                lineHeight: 1,
                            }}
                        >
                            {now.getFullYear()} · last 12 weeks
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <GhostBtn>
                            <span>Range</span>
                            <span
                                className="mono"
                                style={{ fontSize: 10, color: 'var(--ink-3)' }}
                            >
                                12 weeks
                            </span>
                        </GhostBtn>
                        <GhostBtn>
                            <span>Export</span>
                            <Kbd>⌘E</Kbd>
                        </GhostBtn>
                    </div>
                </div>
            </div>

            {/* KPI strip */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    borderBottom: '1px solid var(--rule-strong)',
                }}
            >
                <KPI label={t('analytics.totalApplications')} value={total} sub={`${applied} sent`} />
                <KPI label={t('analytics.activeApplications')} value={active} sub="in motion" tone="accent" />
                <KPI label={t('analytics.avgMatchScore')} value={avgMatch || '—'} sub={scored.length ? `${scored.length} scored` : 'no scores yet'} />
                <KPI label={t('analytics.offersReceived')} value={offers} sub={`${offerRate}% rate`} tone={offers > 0 ? 'moss' : undefined} />
                <KPI
                    label="Events · this week"
                    value={eventsThisWeek}
                    sub={eventsThisWeek > 0 ? 'stage changes' : 'no movement'}
                    tone={eventsThisWeek > 0 ? 'accent' : undefined}
                />
            </div>

            {/* main grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 0 }}>
                {/* weekly */}
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
                        <span
                            className="mono"
                            style={{ fontSize: 10, color: 'var(--ink-4)' }}
                        >
                            last 12 weeks
                        </span>
                        <div style={{ flex: 1 }} />
                        <span
                            className="mono"
                            style={{ fontSize: 10.5, color: 'var(--ink-2)' }}
                        >
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
                        {weekly.map((w, i) => (
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
                                        height: `${(w.count / weeklyMax) * 140}px`,
                                        minHeight: w.count > 0 ? 2 : 0,
                                        background: w.isCurrent ? 'var(--accent)' : 'var(--ink)',
                                    }}
                                />
                                <span
                                    className="mono"
                                    style={{ fontSize: 9, color: 'var(--ink-4)' }}
                                >
                                    W{w.week}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* funnel */}
                <div
                    style={{
                        padding: '22px 28px',
                        borderBottom: '1px solid var(--rule-strong)',
                    }}
                >
                    <Label>Funnel</Label>
                    <div style={{ marginTop: 16 }}>
                        {funnel.map((s) => (
                            <FunnelStep
                                key={s.label}
                                label={s.label}
                                n={s.n}
                                total={applications.length || 1}
                                peak={'peak' in s ? s.peak : undefined}
                            />
                        ))}
                    </div>
                </div>

                {/* sources */}
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
                            marginBottom: 14,
                        }}
                    >
                        <Label>Sources · what worked</Label>
                        <div style={{ flex: 1 }} />
                        <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>
                            <span
                                style={{
                                    background: 'var(--ink-3)',
                                    color: 'var(--paper)',
                                    padding: '0 3px',
                                }}
                            >
                                applied
                            </span>
                            &nbsp;
                            <span
                                style={{
                                    background: 'var(--moss)',
                                    color: 'var(--paper)',
                                    padding: '0 3px',
                                }}
                            >
                                offer
                            </span>
                        </span>
                    </div>
                    {sources.length > 0 ? (
                        <div>
                            {sources.map((s) => (
                                <SourceBar
                                    key={s.src}
                                    src={s.src}
                                    apps={s.apps}
                                    offers={s.offers}
                                    maxApps={sourcesMax}
                                />
                            ))}
                        </div>
                    ) : (
                        <div
                            style={{
                                padding: 18,
                                fontSize: 12,
                                color: 'var(--ink-4)',
                                textAlign: 'center',
                            }}
                        >
                            {t('analytics.empty')}
                        </div>
                    )}
                </div>

                {/* pipeline + remote + match distribution */}
                <div style={{ padding: '22px 28px', borderBottom: '1px solid var(--rule-strong)' }}>
                    <Label>Current pipeline · by stage</Label>
                    {pipelineTotal > 0 ? (
                        <>
                            <div style={{ display: 'flex', gap: 2, marginTop: 14, height: 22 }}>
                                {pipeline.map((s) => (
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
                                {pipeline.map((s) => (
                                    <div key={s.k} style={{ flex: s.n }}>
                                        <Label>{s.k}</Label>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div
                            style={{
                                padding: 18,
                                fontSize: 12,
                                color: 'var(--ink-4)',
                            }}
                        >
                            {t('analytics.empty')}
                        </div>
                    )}

                    <div style={{ marginTop: 22 }}>
                        <Label>Remote · Hybrid · Vor Ort</Label>
                        <div style={{ display: 'flex', marginTop: 10, height: 28 }}>
                            {remote.map((r) => (
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
                        {scored.length > 0 ? (
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
                                    {matchDist.map((n, i) => (
                                        <div
                                            key={i}
                                            style={{
                                                flex: 1,
                                                height: `${(n / matchMax) * 54}px`,
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

                {/* stage transitions — full width, paper */}
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
                        <span
                            className="mono"
                            style={{ fontSize: 10, color: 'var(--ink-4)' }}
                        >
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
                        {transitions.map((tr, i) => (
                            <div
                                key={tr.label}
                                style={{
                                    padding: '14px 16px',
                                    borderRight:
                                        i < transitions.length - 1
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
                    {events.length === 0 && (
                        <div
                            className="serif"
                            style={{
                                marginTop: 12,
                                fontSize: 13,
                                fontStyle: 'italic',
                                color: 'var(--ink-3)',
                            }}
                        >
                            History fills in as you update application statuses.
                            Every stage change is logged locally from now on.
                        </div>
                    )}
                </div>

                {/* observations — full width, dark */}
                <div
                    style={{
                        gridColumn: '1 / 3',
                        padding: '22px 28px',
                        background: 'var(--ink)',
                        color: 'var(--paper)',
                    }}
                >
                    <Label color="var(--paper-3)">Observations · from your data</Label>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: 32,
                            marginTop: 14,
                        }}
                    >
                        {deriveObservations({
                            total,
                            applied,
                            offers,
                            interviews,
                            avgMatch,
                            weeklyMax,
                            sources,
                        }).map((obs, i) => (
                            <div key={i}>
                                <span
                                    className="serif"
                                    style={{
                                        fontSize: 32,
                                        fontWeight: 500,
                                        color: 'var(--accent)',
                                        display: 'block',
                                        lineHeight: 1,
                                        marginBottom: 10,
                                    }}
                                >
                                    {String(i + 1).padStart(2, '0')}
                                </span>
                                <div
                                    style={{
                                        fontSize: 15,
                                        fontWeight: 600,
                                        color: 'var(--paper)',
                                        marginBottom: 6,
                                    }}
                                >
                                    {obs.head}
                                </div>
                                <div
                                    style={{
                                        fontSize: 12.5,
                                        color: 'var(--paper-3)',
                                        lineHeight: 1.5,
                                    }}
                                >
                                    {obs.body}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function deriveObservations(d: {
    total: number;
    applied: number;
    offers: number;
    interviews: number;
    avgMatch: number;
    weeklyMax: number;
    sources: { src: string; apps: number; offers: number }[];
}): { head: string; body: string }[] {
    const out: { head: string; body: string }[] = [];

    if (d.total === 0) {
        return [
            { head: 'Nothing here yet.', body: 'Once you add applications, this space fills in with patterns from your data.' },
            { head: 'Paper, not dashboard.', body: 'Observations are local and editable. They describe what happened, not what to feel.' },
            { head: 'Quiet by default.', body: 'When there is nothing to say, this page will stay quiet.' },
        ];
    }

    if (d.offers > 0) {
        out.push({
            head: `${d.offers} offer${d.offers > 1 ? 's' : ''} logged.`,
            body: `Out of ${d.applied} sent, ${((d.offers / Math.max(1, d.applied)) * 100).toFixed(1)}% came back as offers. That is above the usual job-board baseline.`,
        });
    } else if (d.interviews > 0) {
        out.push({
            head: `${d.interviews} interview${d.interviews > 1 ? 's' : ''} in motion.`,
            body: 'You are past the hardest part — the reply. Sort by stage and focus on the ones sitting in "scheduled".',
        });
    } else {
        out.push({
            head: 'Volume without replies.',
            body: `${d.applied} sent, no interviews yet. Tailor the next 5 per role — same time, better signal.`,
        });
    }

    if (d.sources.length > 0) {
        const top = d.sources[0];
        if (top.apps >= 3) {
            out.push({
                head: `${top.src} is the top funnel.`,
                body: `${top.apps} applications from there, ${top.offers || 0} offer${top.offers === 1 ? '' : 's'}. Keep it, but spread so one channel going cold doesn't stop the week.`,
            });
        }
    }

    if (d.avgMatch > 0) {
        out.push({
            head: `Match avg ${d.avgMatch}/100.`,
            body: d.avgMatch >= 70
                ? 'You are applying to roles that actually fit. Quality > volume pays off here.'
                : d.avgMatch >= 50
                  ? 'Middling fit across the board. Try being choosier — under 60, ask if it is worth the cover letter.'
                  : 'Fit is low on average. Either the scoring is too strict, or you are applying too wide.',
        });
    }

    while (out.length < 3) {
        out.push({
            head: 'Still reading.',
            body: 'More data will sharpen the signal here. Keep logging.',
        });
    }

    return out.slice(0, 3);
}
