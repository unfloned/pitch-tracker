import { ActionIcon, Drawer, Tooltip } from '@mantine/core';
import {
    IconArrowUpRight,
    IconCheck,
    IconEyeOff,
    IconPlus,
    IconStar,
    IconStarFilled,
} from '@tabler/icons-react';
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

export function CandidateDrawer({
    candidate,
    opened,
    onClose,
    onImport,
    onDismiss,
    onToggleFavorite,
}: Props) {
    const { t } = useTranslation();
    if (!candidate) return null;

    const isImported = candidate.status === 'imported';

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
                        <Label>Match</Label>
                        <div style={{ marginTop: 6 }}>
                            <MatchScore value={candidate.score} width={80} showValue />
                        </div>
                    </div>
                    <div style={{ padding: '10px 14px' }}>
                        <Label>Entdeckt</Label>
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

                {/* scoring reason */}
                {candidate.scoreReason && (
                    <div
                        style={{
                            marginTop: 22,
                            paddingLeft: 16,
                            borderLeft: '3px solid var(--accent)',
                        }}
                    >
                        <Label>Warum es passt</Label>
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
                            — local LLM score
                        </span>
                    </div>
                )}

                {/* summary */}
                {candidate.summary && (
                    <div style={{ marginTop: 22 }}>
                        <Label>Zusammenfassung</Label>
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
                            {candidate.summary}
                        </div>
                    </div>
                )}

                {/* source */}
                <div style={{ marginTop: 22 }}>
                    <Label>Gefunden in</Label>
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
                <div style={{ flex: 1 }} />
                {candidate.sourceUrl && (
                    <GhostBtn
                        onClick={() => window.api.shell.openExternal(candidate.sourceUrl)}
                    >
                        <IconArrowUpRight size={12} />
                        <span>Zur Quelle</span>
                    </GhostBtn>
                )}
            </div>
        </Drawer>
    );
}
