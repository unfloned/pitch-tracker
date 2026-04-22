import { SimpleGrid, UnstyledButton } from '@mantine/core';
import {
    IconArrowRight,
    IconCalendarClock,
    IconCheck,
    IconMailQuestion,
    IconSparkles,
    IconTargetArrow,
} from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ApplicationRecord } from '../../preload/index';
import type { ApplicationStatus } from '@shared/application';
import type { SerializedJobCandidate } from '@shared/job-search';
import { GhostBtn } from '../components/primitives/GhostBtn';
import { Label } from '../components/primitives/Label';
import { MatchScore } from '../components/primitives/MatchScore';
import { StageGlyph } from '../components/primitives/StageGlyph';

type PageKey = 'dashboard' | 'applications' | 'candidates' | 'agents' | 'settings';

interface Props {
    applications: ApplicationRecord[];
    onNavigate: (page: PageKey) => void;
    onNewEntry: () => void;
    onQuickAdd: () => void;
    onExport: () => void;
    onOpenApplication: (app: ApplicationRecord) => void;
}

/**
 * Action row: a dense, paper-styled line item for things that need the user's
 * attention. Icon tag on the left, title + subtitle in the middle, right-aligned
 * status/badge, chevron on the far right.
 */
function ActionRow({
    tag,
    title,
    subtitle,
    rightLabel,
    rightTone,
    status,
    onClick,
}: {
    tag?: React.ReactNode;
    title: string;
    subtitle?: string;
    rightLabel?: string;
    rightTone?: 'accent' | 'moss' | 'rust' | 'ink';
    status?: ApplicationStatus;
    onClick: () => void;
}) {
    const rightBg =
        rightTone === 'moss'
            ? 'var(--moss)'
            : rightTone === 'rust'
              ? 'var(--rust)'
              : rightTone === 'accent'
                ? 'var(--accent)'
                : rightTone === 'ink'
                  ? 'var(--ink)'
                  : 'var(--paper-2)';
    const rightColor = rightTone ? 'var(--paper)' : 'var(--ink-2)';

    return (
        <UnstyledButton
            onClick={onClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                width: '100%',
                borderBottom: '1px solid var(--rule)',
                background: 'transparent',
                transition: 'background 80ms',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--paper-2)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
            }}
        >
            {status ? (
                <div style={{ flexShrink: 0 }}>
                    <StageGlyph status={status} size={11} />
                </div>
            ) : (
                <div
                    style={{
                        width: 22,
                        height: 22,
                        flexShrink: 0,
                        background: 'var(--card)',
                        border: '1px solid var(--rule-strong)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--ink-2)',
                    }}
                >
                    {tag}
                </div>
            )}
            <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <div
                    style={{
                        fontSize: 13,
                        color: 'var(--ink)',
                        fontWeight: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {title}
                </div>
                {subtitle && (
                    <div
                        style={{
                            fontSize: 11,
                            color: 'var(--ink-3)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {subtitle}
                    </div>
                )}
            </div>
            {rightLabel && (
                <span
                    className="mono"
                    style={{
                        fontSize: 10.5,
                        fontWeight: 600,
                        padding: '2px 6px',
                        background: rightBg,
                        color: rightColor,
                        letterSpacing: '0.02em',
                        flexShrink: 0,
                    }}
                >
                    {rightLabel}
                </span>
            )}
            <IconArrowRight size={12} style={{ color: 'var(--ink-4)', flexShrink: 0 }} />
        </UnstyledButton>
    );
}

function SectionHeader({ title, count }: { title: string; count?: number }) {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 8,
            }}
        >
            <Label>
                {title}
                {count !== undefined && count > 0 ? ` · ${count}` : ''}
            </Label>
            <div style={{ flex: 1, height: 1, background: 'var(--rule)' }} />
        </div>
    );
}

/**
 * KPI tile: paper surface with Label + serif numeric value. Click-through
 * supported for the "total" tile that jumps to Applications.
 */
function StatTile({
    label,
    value,
    sub,
    onClick,
}: {
    label: string;
    value: string | number;
    sub?: string;
    onClick?: () => void;
}) {
    const body = (
        <div
            style={{
                padding: 16,
                border: '1px solid var(--rule)',
                background: 'var(--card)',
                height: '100%',
            }}
        >
            <Label>{label}</Label>
            <div
                className="serif tnum"
                style={{
                    fontSize: 32,
                    fontWeight: 500,
                    color: 'var(--ink)',
                    letterSpacing: '-0.02em',
                    lineHeight: 1,
                    marginTop: 8,
                }}
            >
                {value}
            </div>
            {sub && (
                <div
                    className="mono"
                    style={{
                        fontSize: 10,
                        color: 'var(--ink-4)',
                        letterSpacing: '0.02em',
                        marginTop: 6,
                    }}
                >
                    {sub}
                </div>
            )}
        </div>
    );
    if (onClick) {
        return (
            <UnstyledButton
                onClick={onClick}
                style={{ width: '100%', textAlign: 'left', height: '100%' }}
            >
                {body}
            </UnstyledButton>
        );
    }
    return body;
}

export function DashboardPage({
    applications,
    onNavigate,
    onNewEntry,
    onOpenApplication,
}: Props) {
    const { t } = useTranslation();
    const [candidates, setCandidates] = useState<SerializedJobCandidate[]>([]);

    useEffect(() => {
        window.api.agents.listCandidates(0).then(setCandidates).catch(() => {});
    }, []);

    const data = useMemo(() => {
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
            followUps.length + pendingOffers.length + interviewsSoon.length + newCandidates.length;

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
        };
    }, [applications, candidates]);

    const recentActivity = useMemo(
        () =>
            [...applications]
                .sort(
                    (a, b) =>
                        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
                )
                .slice(0, 6),
        [applications],
    );

    if (applications.length === 0 && candidates.length === 0) {
        return (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 500,
                    gap: 16,
                }}
            >
                <div
                    style={{
                        width: 56,
                        height: 56,
                        background: 'var(--accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--ink)',
                    }}
                >
                    <IconSparkles size={28} />
                </div>
                <div style={{ textAlign: 'center', maxWidth: 420 }}>
                    <div
                        className="serif"
                        style={{
                            fontSize: 22,
                            fontWeight: 500,
                            color: 'var(--ink)',
                            letterSpacing: '-0.015em',
                            marginBottom: 6,
                        }}
                    >
                        {t('dashboard.welcomeTitle')}
                    </div>
                    <div style={{ fontSize: 13.5, color: 'var(--ink-3)', lineHeight: 1.5 }}>
                        {t('dashboard.welcomeSubtitle')}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <GhostBtn
                        active
                        onClick={onNewEntry}
                        style={{
                            background: 'var(--ink)',
                            color: 'var(--paper)',
                            borderColor: 'var(--ink)',
                        }}
                    >
                        <span>＋ {t('toolbar.newEntry')}</span>
                    </GhostBtn>
                    <GhostBtn onClick={() => onNavigate('agents')}>
                        <span>{t('nav.agents')}</span>
                    </GhostBtn>
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {/* masthead */}
            <div>
                <Label>Inbox</Label>
                <div
                    className="serif"
                    style={{
                        fontSize: 28,
                        fontWeight: 500,
                        color: 'var(--ink)',
                        letterSpacing: '-0.02em',
                        marginTop: 4,
                        lineHeight: 1.05,
                    }}
                >
                    {t('dashboard.title')}
                </div>
                <div
                    className="mono"
                    style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}
                >
                    {t('dashboard.subtitle')}
                </div>
            </div>

            {/* Today */}
            <div>
                <SectionHeader
                    title={t('dashboard.sectionToday')}
                    count={data.actionCount}
                />
                {data.actionCount === 0 ? (
                    <div
                        style={{
                            padding: 22,
                            border: '1px solid var(--rule)',
                            background: 'var(--card)',
                            textAlign: 'center',
                        }}
                    >
                        <div
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                            }}
                        >
                            <IconCheck
                                size={16}
                                style={{ color: 'var(--moss)' }}
                            />
                            <span
                                className="serif"
                                style={{
                                    fontSize: 17,
                                    fontWeight: 500,
                                    color: 'var(--ink)',
                                }}
                            >
                                {t('dashboard.allClearTitle')}
                            </span>
                        </div>
                        <div
                            style={{
                                fontSize: 12.5,
                                color: 'var(--ink-3)',
                                marginTop: 6,
                            }}
                        >
                            {t('dashboard.allClearSubtitle')}
                        </div>
                    </div>
                ) : (
                    <div
                        style={{
                            border: '1px solid var(--rule)',
                            background: 'var(--card)',
                        }}
                    >
                        {data.pendingOffers.map((app) => (
                            <ActionRow
                                key={`offer-${app.id}`}
                                tag={<IconTargetArrow size={12} />}
                                status={app.status}
                                title={`${app.companyName || '—'} · ${app.jobTitle || '—'}`}
                                subtitle={t('dashboard.pendingDecision')}
                                rightLabel={t('status.offer_received')}
                                rightTone="moss"
                                onClick={() => onOpenApplication(app)}
                            />
                        ))}
                        {data.interviewsSoon.map((app) => (
                            <ActionRow
                                key={`int-${app.id}`}
                                tag={<IconCalendarClock size={12} />}
                                status={app.status}
                                title={`${app.companyName || '—'} · ${app.jobTitle || '—'}`}
                                subtitle={t('dashboard.interviewsSoon')}
                                rightLabel={t(`status.${app.status}`)}
                                rightTone="rust"
                                onClick={() => onOpenApplication(app)}
                            />
                        ))}
                        {data.followUps.slice(0, 5).map((app) => {
                            const days = Math.floor(
                                (Date.now() - new Date(app.appliedAt!).getTime()) /
                                    (24 * 60 * 60 * 1000),
                            );
                            return (
                                <ActionRow
                                    key={`fu-${app.id}`}
                                    tag={<IconMailQuestion size={12} />}
                                    status={app.status}
                                    title={`${app.companyName || '—'} · ${app.jobTitle || '—'}`}
                                    subtitle={t('dashboard.followUpsHint')}
                                    rightLabel={`${days}d`}
                                    rightTone="accent"
                                    onClick={() => onOpenApplication(app)}
                                />
                            );
                        })}
                        {data.topCandidates.slice(0, 5).map((c) => (
                            <ActionRow
                                key={`c-${c.id}`}
                                tag={<IconSparkles size={12} />}
                                title={c.title || c.company || 'Untitled'}
                                subtitle={c.company}
                                rightLabel={`${c.score}`}
                                rightTone={
                                    c.score >= 80
                                        ? 'moss'
                                        : c.score >= 60
                                          ? 'accent'
                                          : 'ink'
                                }
                                onClick={() => onNavigate('candidates')}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Stats */}
            <div>
                <SectionHeader title={t('dashboard.sectionStats')} />
                <SimpleGrid cols={{ base: 2, sm: 3, md: 5 }} spacing="sm">
                    <StatTile
                        label={t('dashboard.total')}
                        value={data.total}
                        onClick={() => onNavigate('applications')}
                    />
                    <StatTile label={t('dashboard.applied')} value={data.applied} />
                    <StatTile
                        label={t('dashboard.interviewing')}
                        value={data.interviewing}
                    />
                    <StatTile
                        label={t('dashboard.accepted')}
                        value={data.accepted}
                    />
                    <StatTile
                        label={t('dashboard.avgMatch')}
                        value={data.avgMatch > 0 ? data.avgMatch : t('dashboard.emptyStat')}
                        sub={data.avgMatch > 0 ? '/ 100' : undefined}
                    />
                </SimpleGrid>
            </div>

            {/* Recent activity */}
            {recentActivity.length > 0 && (
                <div>
                    <SectionHeader title={t('dashboard.sectionActivity')} />
                    <div
                        style={{
                            border: '1px solid var(--rule)',
                            background: 'var(--card)',
                        }}
                    >
                        {recentActivity.map((app) => (
                            <UnstyledButton
                                key={app.id}
                                onClick={() => onOpenApplication(app)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    padding: '10px 12px',
                                    width: '100%',
                                    borderBottom: '1px solid var(--rule)',
                                    background: 'transparent',
                                    transition: 'background 80ms',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'var(--paper-2)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                }}
                            >
                                <StageGlyph status={app.status} size={10} />
                                <div
                                    style={{
                                        flex: 1,
                                        minWidth: 0,
                                        textAlign: 'left',
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: 13,
                                            color: 'var(--ink)',
                                            fontWeight: 500,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {app.companyName || '—'}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 11,
                                            color: 'var(--ink-3)',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {app.jobTitle || '—'}
                                    </div>
                                </div>
                                {app.matchScore > 0 && (
                                    <MatchScore
                                        value={app.matchScore}
                                        width={36}
                                        showValue={false}
                                    />
                                )}
                                <span
                                    className="mono"
                                    style={{
                                        fontSize: 10,
                                        color: 'var(--ink-3)',
                                        letterSpacing: '0.02em',
                                        minWidth: 70,
                                        textAlign: 'right',
                                    }}
                                >
                                    {new Date(app.updatedAt).toLocaleDateString()}
                                </span>
                            </UnstyledButton>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
