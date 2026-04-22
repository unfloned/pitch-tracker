import {
    IconCalendarClock,
    IconCheck,
    IconMailQuestion,
    IconSparkles,
    IconTargetArrow,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { ApplicationRecord } from '../../../preload/index';
import type { SerializedJobCandidate } from '@shared/job-search';
import { ActionRow, type ActionTone } from './ActionRow';
import { SectionHeader } from './SectionHeader';
import type { PageKey } from './types';

interface Props {
    actionCount: number;
    pendingOffers: ApplicationRecord[];
    interviewsSoon: ApplicationRecord[];
    followUps: ApplicationRecord[];
    topCandidates: SerializedJobCandidate[];
    onOpenApplication: (app: ApplicationRecord) => void;
    onNavigate: (page: PageKey) => void;
}

function candidateTone(score: number): ActionTone {
    if (score >= 80) return 'moss';
    if (score >= 60) return 'accent';
    return 'ink';
}

/** The "Today" list with offers, interviews, follow-ups and new candidates. */
export function ActionsCard({
    actionCount,
    pendingOffers,
    interviewsSoon,
    followUps,
    topCandidates,
    onOpenApplication,
    onNavigate,
}: Props) {
    const { t } = useTranslation();

    return (
        <div>
            <SectionHeader title={t('dashboard.sectionToday')} count={actionCount} />
            {actionCount === 0 ? (
                <AllClearBanner />
            ) : (
                <div style={{ border: '1px solid var(--rule)', background: 'var(--card)' }}>
                    {pendingOffers.map((app) => (
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
                    {interviewsSoon.map((app) => (
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
                    {followUps.slice(0, 5).map((app) => {
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
                    {topCandidates.slice(0, 5).map((c) => (
                        <ActionRow
                            key={`c-${c.id}`}
                            tag={<IconSparkles size={12} />}
                            title={c.title || c.company || 'Untitled'}
                            subtitle={c.company}
                            rightLabel={`${c.score}`}
                            rightTone={candidateTone(c.score)}
                            onClick={() => onNavigate('candidates')}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function AllClearBanner() {
    const { t } = useTranslation();
    return (
        <div
            style={{
                padding: 22,
                border: '1px solid var(--rule)',
                background: 'var(--card)',
                textAlign: 'center',
            }}
        >
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <IconCheck size={16} style={{ color: 'var(--moss)' }} />
                <span
                    className="serif"
                    style={{ fontSize: 17, fontWeight: 500, color: 'var(--ink)' }}
                >
                    {t('dashboard.allClearTitle')}
                </span>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 6 }}>
                {t('dashboard.allClearSubtitle')}
            </div>
        </div>
    );
}
