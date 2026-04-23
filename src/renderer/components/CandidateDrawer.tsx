import { ActionIcon, Drawer, Tooltip } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
    IconArrowUpRight,
    IconCheck,
    IconEyeOff,
    IconPlus,
    IconRefresh,
    IconStar,
    IconStarFilled,
} from '@tabler/icons-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { SerializedJobCandidate } from '@shared/job-search';
import { GhostBtn } from './primitives/GhostBtn';
import { Kbd } from './primitives/Kbd';
import { Label } from './primitives/Label';
import { MatchScore } from './primitives/MatchScore';

interface Props {
    candidate: SerializedJobCandidate | null;
    opened: boolean;
    onClose: () => void;
    onImport: (candidate: SerializedJobCandidate) => void | Promise<void>;
    onDismiss: (candidate: SerializedJobCandidate) => void | Promise<void>;
    onToggleFavorite: (candidate: SerializedJobCandidate) => void | Promise<void>;
    onRescore: (candidate: SerializedJobCandidate) => void | Promise<void>;
}

function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(iso).toLocaleDateString();
}

function shortSource(key: string): string {
    const [src] = key.split(':');
    return src || key;
}

const SUMMARY_COLLAPSED_LEN = 600;

function SummaryBlock({ summary }: { summary: string }) {
    const { t } = useTranslation();
    const [expanded, setExpanded] = useState(false);
    const needsToggle = summary.length > SUMMARY_COLLAPSED_LEN;
    const shown = expanded || !needsToggle
        ? summary
        : summary.slice(0, SUMMARY_COLLAPSED_LEN).trimEnd() + '…';

    return (
        <div style={{ marginTop: 22 }}>
            <Label>{t('candidates.summary')}</Label>
            <div
                style={{
                    marginTop: 8,
                    padding: 14,
                    background: 'var(--card)',
                    border: '1px solid var(--rule)',
                    fontSize: 13.5,
                    lineHeight: 1.55,
                    color: 'var(--ink-2)',
                    whiteSpace: 'pre-wrap',
                }}
            >
                {shown}
            </div>
            {needsToggle && (
                <div style={{ marginTop: 6 }}>
                    <GhostBtn onClick={() => setExpanded((v) => !v)}>
                        <span>
                            {expanded ? t('candidates.showLess') : t('candidates.showMore')}
                        </span>
                    </GhostBtn>
                </div>
            )}
        </div>
    );
}

export function CandidateDrawer({
    candidate,
    opened,
    onClose,
    onImport,
    onDismiss,
    onToggleFavorite,
    onRescore,
}: Props) {
    const { t } = useTranslation();
    const [rescoring, setRescoring] = useState(false);
    if (!candidate) return null;

    const isImported = candidate.status === 'imported';
    const hasAnalysis =
        candidate.keyFacts.length +
            candidate.concerns.length +
            candidate.redFlags.length >
        0;

    const handleRescore = async () => {
        if (!candidate || rescoring) return;
        setRescoring(true);
        try {
            await onRescore(candidate);
            notifications.show({
                color: 'green',
                message: t('candidates.rescoreSuccess'),
            });
        } catch (err) {
            notifications.show({
                color: 'red',
                title: t('candidates.rescoreFailed'),
                message: (err as Error).message,
            });
        } finally {
            setRescoring(false);
        }
    };

    return (
        <Drawer
            opened={opened}
            onClose={onClose}
            position="right"
            size={520}
            withCloseButton={false}
            padding={0}
            styles={{
                content: { display: 'flex', flexDirection: 'column' },
                body: { padding: 0, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 },
            }}
        >
            {/* header */}
            <div
                style={{
                    padding: '18px 22px 14px',
                    borderBottom: '1px solid var(--rule)',
                    background: 'var(--paper)',
                    flexShrink: 0,
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        marginBottom: 10,
                    }}
                >
                    <span
                        className="mono"
                        style={{
                            fontSize: 10.5,
                            color: 'var(--ink-3)',
                            letterSpacing: '0.08em',
                        }}
                    >
                        {candidate.id.slice(0, 8).toUpperCase()}
                    </span>
                    <div style={{ width: 1, height: 10, background: 'var(--rule-strong)' }} />
                    <span
                        className="mono"
                        style={{
                            fontSize: 10,
                            color: 'var(--ink-4)',
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                        }}
                    >
                        {shortSource(candidate.sourceKey)}
                    </span>
                    <div style={{ flex: 1 }} />
                    <Tooltip
                        label={
                            candidate.favorite
                                ? t('candidates.removeStar')
                                : t('candidates.star')
                        }
                    >
                        <ActionIcon
                            variant="subtle"
                            size="sm"
                            color={candidate.favorite ? 'yellow' : 'gray'}
                            onClick={() => onToggleFavorite(candidate)}
                        >
                            {candidate.favorite ? (
                                <IconStarFilled size={14} />
                            ) : (
                                <IconStar size={14} />
                            )}
                        </ActionIcon>
                    </Tooltip>
                    <GhostBtn onClick={onClose}>
                        <span>Close</span>
                        <Kbd>esc</Kbd>
                    </GhostBtn>
                </div>

                <div
                    className="serif"
                    style={{
                        fontSize: 26,
                        fontWeight: 500,
                        color: 'var(--ink)',
                        letterSpacing: '-0.015em',
                        lineHeight: 1.15,
                    }}
                >
                    {candidate.title || t('candidates.untitled', 'Untitled')}
                </div>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginTop: 6,
                    }}
                >
                    <span style={{ fontSize: 14, color: 'var(--ink-2)', fontWeight: 500 }}>
                        {candidate.company || '—'}
                    </span>
                    {candidate.location && (
                        <>
                            <span style={{ color: 'var(--ink-4)' }}>·</span>
                            <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>
                                {candidate.location}
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* body */}
            <div style={{ flex: 1, overflow: 'auto', padding: '18px 22px' }}>
                {/* match score */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 0,
                        background: 'var(--card)',
                        border: '1px solid var(--rule)',
                    }}
                >
                    <div
                        style={{
                            padding: '10px 14px',
                            borderRight: '1px solid var(--rule)',
                        }}
                    >
                        <Label>{t('candidates.matchLabel')}</Label>
                        <div style={{ marginTop: 6 }}>
                            <MatchScore value={candidate.score} width={80} showValue />
                        </div>
                    </div>
                    <div style={{ padding: '10px 14px' }}>
                        <Label>{t('candidates.discovered')}</Label>
                        <div
                            style={{
                                fontSize: 13,
                                color: 'var(--ink)',
                                fontWeight: 500,
                                marginTop: 4,
                            }}
                        >
                            {timeAgo(candidate.discoveredAt)}
                        </div>
                    </div>
                </div>

                {/* empty-analysis hint + rescore */}
                {!hasAnalysis && (
                    <div
                        style={{
                            marginTop: 22,
                            padding: '10px 14px',
                            background: 'var(--paper-2)',
                            border: '1px dashed var(--rule-strong)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                        }}
                    >
                        <span style={{ fontSize: 12, color: 'var(--ink-3)', flex: 1 }}>
                            {t('candidates.noDetailedAnalysis')}
                        </span>
                        <GhostBtn onClick={handleRescore} disabled={rescoring}>
                            <IconRefresh size={12} />
                            <span>{rescoring ? t('candidates.rescoring') : t('candidates.rescore')}</span>
                        </GhostBtn>
                    </div>
                )}

                {/* red flags: hard disqualifiers */}
                {candidate.redFlags.length > 0 && (
                    <div
                        style={{
                            marginTop: 22,
                            padding: '10px 14px',
                            background: 'rgba(192, 48, 48, 0.06)',
                            border: '1px solid rgba(192, 48, 48, 0.3)',
                        }}
                    >
                        <Label>{t('candidates.redFlagsLabel')}</Label>
                        <ul
                            style={{
                                margin: '8px 0 0',
                                paddingLeft: 18,
                                fontSize: 13,
                                color: 'var(--danger, #7a1f1f)',
                                lineHeight: 1.5,
                            }}
                        >
                            {candidate.redFlags.map((flag, i) => (
                                <li key={i}>{flag}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* scoring reason (verdict) */}
                {candidate.scoreReason && (
                    <div
                        style={{
                            marginTop: 22,
                            paddingLeft: 16,
                            borderLeft: '3px solid var(--accent)',
                        }}
                    >
                        <Label>{t('candidates.verdict')}</Label>
                        <p
                            className="serif"
                            style={{
                                fontSize: 15,
                                fontStyle: 'italic',
                                color: 'var(--ink-2)',
                                marginTop: 6,
                                lineHeight: 1.45,
                                marginBottom: 0,
                            }}
                        >
                            {candidate.scoreReason}
                        </p>
                        <span
                            className="mono"
                            style={{ fontSize: 10, color: 'var(--ink-4)' }}
                        >
                            {t('candidates.localLlmScore')}
                        </span>
                    </div>
                )}

                {/* key facts / concerns two-column grid */}
                {(candidate.keyFacts.length > 0 || candidate.concerns.length > 0) && (
                    <div
                        style={{
                            marginTop: 22,
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: 14,
                        }}
                    >
                        {candidate.keyFacts.length > 0 && (
                            <div
                                style={{
                                    padding: '10px 14px',
                                    background: 'var(--card)',
                                    border: '1px solid var(--rule)',
                                }}
                            >
                                <Label>{t('candidates.strengths')}</Label>
                                <ul
                                    style={{
                                        margin: '8px 0 0',
                                        paddingLeft: 18,
                                        fontSize: 12.5,
                                        color: 'var(--ink-2)',
                                        lineHeight: 1.5,
                                    }}
                                >
                                    {candidate.keyFacts.map((fact, i) => (
                                        <li key={i}>{fact}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {candidate.concerns.length > 0 && (
                            <div
                                style={{
                                    padding: '10px 14px',
                                    background: 'var(--card)',
                                    border: '1px solid var(--rule)',
                                }}
                            >
                                <Label>{t('candidates.concernsLabel')}</Label>
                                <ul
                                    style={{
                                        margin: '8px 0 0',
                                        paddingLeft: 18,
                                        fontSize: 12.5,
                                        color: 'var(--ink-3)',
                                        lineHeight: 1.5,
                                    }}
                                >
                                    {candidate.concerns.map((concern, i) => (
                                        <li key={i}>{concern}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                {/* summary */}
                {candidate.summary && (
                    <SummaryBlock summary={candidate.summary} />
                )}

                {/* source */}
                <div style={{ marginTop: 22 }}>
                    <Label>{t('candidates.foundIn')}</Label>
                    <div
                        style={{
                            marginTop: 8,
                            padding: '10px 14px',
                            background: 'var(--card)',
                            border: '1px solid var(--rule)',
                        }}
                    >
                        <div
                            className="mono"
                            style={{
                                fontSize: 11,
                                color: 'var(--ink-3)',
                                letterSpacing: '0.02em',
                                marginBottom: 4,
                            }}
                        >
                            {candidate.sourceKey}
                        </div>
                        {candidate.sourceUrl && (
                            <button
                                type="button"
                                onClick={() => window.api.shell.openExternal(candidate.sourceUrl)}
                                style={{
                                    border: 'none',
                                    background: 'transparent',
                                    padding: 0,
                                    fontSize: 12.5,
                                    color: 'var(--accent-ink)',
                                    fontFamily: 'var(--f-ui)',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    wordBreak: 'break-all',
                                }}
                            >
                                {candidate.sourceUrl.slice(0, 80)}
                                {candidate.sourceUrl.length > 80 && '…'}
                                <IconArrowUpRight size={12} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* footer actions */}
            <div
                style={{
                    display: 'flex',
                    gap: 6,
                    padding: 12,
                    borderTop: '1px solid var(--rule)',
                    background: 'var(--paper-2)',
                    flexShrink: 0,
                }}
            >
                {isImported ? (
                    <GhostBtn disabled>
                        <IconCheck size={12} />
                        <span>{t('candidates.imported')}</span>
                    </GhostBtn>
                ) : (
                    <>
                        <GhostBtn
                            active
                            onClick={() => onImport(candidate)}
                            style={{
                                background: 'var(--ink)',
                                color: 'var(--paper)',
                                borderColor: 'var(--ink)',
                            }}
                        >
                            <IconPlus size={12} />
                            <span>{t('candidates.addAsApplication')}</span>
                        </GhostBtn>
                        <GhostBtn onClick={() => onDismiss(candidate)}>
                            <IconEyeOff size={12} />
                            <span>{t('candidates.dismiss')}</span>
                        </GhostBtn>
                    </>
                )}
                <GhostBtn onClick={handleRescore} disabled={rescoring}>
                    <IconRefresh size={12} />
                    <span>{rescoring ? t('candidates.rescoring') : t('candidates.rescore')}</span>
                </GhostBtn>
                <div style={{ flex: 1 }} />
                {candidate.sourceUrl && (
                    <GhostBtn
                        onClick={() => window.api.shell.openExternal(candidate.sourceUrl)}
                    >
                        <IconArrowUpRight size={12} />
                        <span>{t('candidates.viewSource')}</span>
                    </GhostBtn>
                )}
            </div>
        </Drawer>
    );
}
