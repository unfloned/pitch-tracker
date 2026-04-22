import { ActionIcon, Checkbox, Tooltip } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
    IconArrowUpRight,
    IconCheck,
    IconEyeOff,
    IconPlus,
    IconStar,
    IconStarFilled,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { ApplicationRecord } from '../../../preload/index';
import type { SerializedJobCandidate } from '@shared/job-search';
import { MatchScore } from '../primitives/MatchScore';
import { timeAgo } from './utils';

interface Props {
    candidate: SerializedJobCandidate;
    selected: boolean;
    onOpen: (candidate: SerializedJobCandidate) => void;
    onToggleSelect: (id: string) => void;
    onCandidateImported: (app: ApplicationRecord) => void;
    onRefresh: () => Promise<void>;
}

export function CandidateRow({
    candidate: c,
    selected,
    onOpen,
    onToggleSelect,
    onCandidateImported,
    onRefresh,
}: Props) {
    const { t } = useTranslation();

    return (
        <div
            onClick={() => onOpen(c)}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                borderBottom: '1px solid var(--rule)',
                cursor: 'pointer',
                transition: 'background 80ms',
                position: 'relative',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--paper-2)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
            }}
        >
            <div onClick={(e) => e.stopPropagation()}>
                <Checkbox
                    size="xs"
                    checked={selected}
                    onChange={() => onToggleSelect(c.id)}
                />
            </div>

            <div style={{ flexShrink: 0 }}>
                <MatchScore value={c.score} width={36} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                        style={{
                            fontSize: 13,
                            color: 'var(--ink)',
                            fontWeight: 600,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            minWidth: 0,
                        }}
                    >
                        {c.title || c.company || 'Untitled'}
                    </span>
                    {c.favorite && (
                        <IconStarFilled
                            size={11}
                            style={{ color: 'var(--accent)', flexShrink: 0 }}
                        />
                    )}
                </div>
                <div
                    className="mono"
                    style={{
                        fontSize: 10.5,
                        color: 'var(--ink-3)',
                        letterSpacing: '0.02em',
                        marginTop: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {[c.company, c.location, timeAgo(c.discoveredAt)]
                        .filter(Boolean)
                        .join(' · ')}
                </div>
                {c.scoreReason && (
                    <div
                        style={{
                            fontSize: 11.5,
                            color: 'var(--ink-2)',
                            marginTop: 3,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {c.scoreReason}
                    </div>
                )}
            </div>

            <div
                onClick={(e) => e.stopPropagation()}
                style={{ display: 'flex', gap: 4, flexShrink: 0 }}
            >
                <Tooltip
                    label={c.favorite ? t('candidates.removeStar') : t('candidates.star')}
                >
                    <ActionIcon
                        variant="subtle"
                        size="sm"
                        color="gray"
                        onClick={async () => {
                            await window.api.agents.updateCandidate(c.id, {
                                favorite: !c.favorite,
                            });
                            await onRefresh();
                        }}
                    >
                        {c.favorite ? (
                            <IconStarFilled size={13} style={{ color: 'var(--accent)' }} />
                        ) : (
                            <IconStar size={13} />
                        )}
                    </ActionIcon>
                </Tooltip>
                {c.status === 'imported' ? (
                    <ImportedBadge label={t('candidates.imported')} />
                ) : (
                    <>
                        <Tooltip label={t('candidates.addAsApplication')}>
                            <ActionIcon
                                variant="subtle"
                                size="sm"
                                color="gray"
                                onClick={async () => {
                                    const app = await window.api.agents.importCandidate(c.id);
                                    onCandidateImported(app);
                                    notifications.show({
                                        color: 'green',
                                        message: t('candidates.candidateAdded', {
                                            name: c.company || c.title,
                                        }),
                                    });
                                    await onRefresh();
                                }}
                            >
                                <IconPlus size={13} />
                            </ActionIcon>
                        </Tooltip>
                        <Tooltip label={t('candidates.dismiss')}>
                            <ActionIcon
                                variant="subtle"
                                size="sm"
                                color="gray"
                                onClick={async () => {
                                    await window.api.agents.updateCandidate(c.id, {
                                        status: 'ignored',
                                    });
                                    await onRefresh();
                                }}
                            >
                                <IconEyeOff size={13} />
                            </ActionIcon>
                        </Tooltip>
                    </>
                )}
                <Tooltip label="Zur Quelle">
                    <ActionIcon
                        variant="subtle"
                        size="sm"
                        color="gray"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.api.shell.openExternal(c.sourceUrl);
                        }}
                    >
                        <IconArrowUpRight size={13} />
                    </ActionIcon>
                </Tooltip>
            </div>
        </div>
    );
}

function ImportedBadge({ label }: { label: string }) {
    return (
        <span
            className="mono"
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 6px',
                background: 'var(--moss)',
                color: 'var(--paper)',
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.02em',
            }}
        >
            <IconCheck size={10} />
            {label}
        </span>
    );
}
