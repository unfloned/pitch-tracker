import { ActionIcon, Tooltip } from '@mantine/core';
import {
    IconExternalLink,
    IconEye,
    IconTrash,
} from '@tabler/icons-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ApplicationRecord } from '../../preload/index';
import type { ApplicationStatus } from '@shared/application';
import { StatusSelector } from './StatusSelector';
import { MatchScore } from './primitives/MatchScore';
import { useContextMenu } from './primitives/ContextMenu';

function priorityColor(priority: string): string {
    if (priority === 'high') return 'var(--accent)';
    if (priority === 'medium') return 'var(--ink-3)';
    return 'var(--rule-strong)';
}

function initialsFor(name: string): string {
    if (!name) return '?';
    const clean = name.replace(/\s+(GmbH|AG|SE|Ltd|LLC|Inc\.?)$/i, '').trim();
    const words = clean.split(/\s+/).filter(Boolean);
    if (words.length === 0) return '?';
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
}

function formatSalary(min: number, max: number, currency: string): string {
    if (!min && !max) return '—';
    const c = currency || 'EUR';
    const sym = c === 'EUR' ? '€' : c + ' ';
    if (min && max) return `${sym}${(min / 1000).toFixed(0)}–${(max / 1000).toFixed(0)}k`;
    return `${sym}${((min || max) / 1000).toFixed(0)}k`;
}

function formatLocation(row: ApplicationRecord, t: (k: string) => string): string {
    const loc = row.location?.trim();
    const rem = row.remote ? t(`remote.${row.remote}`) : '';
    if (loc && rem) return `${rem} · ${loc}`;
    return loc || rem || '—';
}

function formatUpdated(date?: string | Date | null): string {
    if (!date) return '—';
    const d = typeof date === 'string' ? new Date(date) : date;
    const diff = Date.now() - d.getTime();
    const h = Math.floor(diff / 3_600_000);
    if (h < 1) return 'just now';
    if (h < 24) return `${h}h ago`;
    const days = Math.floor(h / 24);
    if (days < 30) return `${days}d ago`;
    return d.toISOString().slice(0, 10);
}

function shortSource(src: string): string {
    if (!src) return 'direct';
    return src.replace(/^https?:\/\//, '').replace(/\/$/, '').slice(0, 14);
}

/** Grid columns matching the column header in ApplicationsPage. */
export const ROW_GRID =
    '4px 72px 140px minmax(240px, 1fr) 96px 120px 96px 78px 72px 60px';

interface Props {
    row: ApplicationRecord;
    selected?: boolean;
    onEdit: (row: ApplicationRecord) => void;
    onDelete: (id: string) => void;
    onStatusChange: (id: string, status: ApplicationStatus) => void;
}

export function ApplicationRow({ row, selected, onEdit, onDelete, onStatusChange }: Props) {
    const { t } = useTranslation();
    const idShort = row.id?.slice(0, 8).toUpperCase() || '—';
    const initials = initialsFor(row.companyName || row.jobTitle || 'X');
    const { open: openContext, menu: contextMenu } = useContextMenu();
    const [hovered, setHovered] = useState(false);

    const rowBg = selected
        ? 'var(--paper-2)'
        : hovered
          ? 'var(--row-hover)'
          : 'var(--card)';

    return (
        <>
        {contextMenu}
        <div
            onClick={() => onEdit(row)}
            onContextMenu={(e) =>
                openContext(e, [
                    {
                        label: t('common.view', 'Anzeigen'),
                        icon: <IconEye size={13} />,
                        onClick: () => onEdit(row),
                    },
                    {
                        label: t('common.openExternal', 'Stellenanzeige öffnen'),
                        icon: <IconExternalLink size={13} />,
                        onClick: () => row.jobUrl && window.api.shell.openExternal(row.jobUrl),
                    },
                    {
                        label: t('common.delete'),
                        icon: <IconTrash size={13} />,
                        danger: true,
                        onClick: () => {
                            if (
                                confirm(
                                    t('confirm.deleteApplication', {
                                        name: row.companyName || row.jobTitle || '',
                                    }),
                                )
                            ) {
                                onDelete(row.id);
                            }
                        },
                    },
                ])
            }
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: 'grid',
                gridTemplateColumns: ROW_GRID,
                alignItems: 'center',
                height: 40,
                background: rowBg,
                borderBottom: '1px solid var(--rule)',
                cursor: 'pointer',
                transition: 'background 80ms',
            }}
        >
            {/* 1: priority strip */}
            <div style={{ height: '100%', background: priorityColor(row.priority) }} />

            {/* 2: id */}
            <div
                className="mono"
                style={{
                    fontSize: 10.5,
                    color: 'var(--ink-3)',
                    paddingLeft: 10,
                    letterSpacing: '0.04em',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                }}
            >
                {idShort}
            </div>

            {/* 3: stage (StatusSelector renders its own StageGlyph) */}
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    paddingRight: 8,
                    minWidth: 0,
                    overflow: 'hidden',
                }}
            >
                <StatusSelector
                    value={row.status}
                    onChange={(status) => onStatusChange(row.id, status)}
                    compact
                />
            </div>

            {/* 4: role + company */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    paddingRight: 12,
                    minWidth: 0,
                }}
            >
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
                    }}
                >
                    <span
                        className="mono"
                        style={{ fontSize: 9, fontWeight: 600, color: 'var(--ink-2)' }}
                    >
                        {initials}
                    </span>
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                        style={{
                            fontSize: 13,
                            color: 'var(--ink)',
                            fontWeight: 600,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {row.jobTitle || t('applications.table.noTitle')}
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
                        {row.companyName || t('applications.table.noCompany')}
                    </div>
                </div>
            </div>

            {/* 5: salary */}
            <div
                className="mono tnum"
                style={{ fontSize: 11, color: 'var(--ink-2)', fontWeight: 500 }}
            >
                {formatSalary(row.salaryMin, row.salaryMax, row.salaryCurrency)}
            </div>

            {/* 6: location */}
            <div
                style={{
                    fontSize: 11,
                    color: 'var(--ink-3)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    paddingRight: 8,
                }}
            >
                {formatLocation(row, t)}
            </div>

            {/* 7: match */}
            <div>
                {row.matchScore > 0 ? (
                    <Tooltip label={row.matchReason || 'LLM score'} multiline w={280}>
                        <span>
                            <MatchScore value={row.matchScore} width={40} />
                        </span>
                    </Tooltip>
                ) : (
                    <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)' }}>
                        —
                    </span>
                )}
            </div>

            {/* 8: source */}
            <div
                className="mono"
                style={{
                    fontSize: 10,
                    color: 'var(--ink-4)',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                }}
            >
                {shortSource(row.source)}
            </div>

            {/* 9: updated */}
            <div
                className="mono"
                style={{ fontSize: 10.5, color: 'var(--ink-3)', letterSpacing: '0.02em' }}
            >
                {formatUpdated(row.updatedAt)}
            </div>

            {/* 10: actions — sticky to right edge so they stay visible on
                 horizontal scroll. Background matches row so underlying cells
                 scroll behind cleanly. */}
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 2,
                    height: '100%',
                    position: 'sticky',
                    right: 0,
                    background: rowBg,
                    borderLeft: '1px solid var(--rule)',
                    zIndex: 1,
                }}
            >
                {row.jobUrl && (
                    <Tooltip label={t('applications.openLink')}>
                        <ActionIcon
                            variant="subtle"
                            size="xs"
                            color="gray"
                            onClick={() => window.api.shell.openExternal(row.jobUrl)}
                        >
                            <IconExternalLink size={12} />
                        </ActionIcon>
                    </Tooltip>
                )}
                <Tooltip label={t('common.delete')}>
                    <ActionIcon
                        variant="subtle"
                        size="xs"
                        color="gray"
                        onClick={() => {
                            if (
                                confirm(
                                    t('confirm.deleteApplication', {
                                        name: row.companyName || row.jobTitle || '',
                                    }),
                                )
                            )
                                onDelete(row.id);
                        }}
                    >
                        <IconTrash size={12} />
                    </ActionIcon>
                </Tooltip>
            </div>
        </div>
        </>
    );
}

