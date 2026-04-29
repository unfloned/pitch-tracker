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
import {
    formatSalary,
    formatUpdated,
    initialsFor,
    priorityColor,
    shortSource,
} from '../lib/format';
import {
    APP_COLUMN_DEFS,
    buildAppRowGrid,
    type AppColumnId,
} from './applications/prefs';
import { StatusSelector } from './StatusSelector';
import { MatchScore } from './primitives/MatchScore';
import { useContextMenu } from './primitives/ContextMenu';

function formatLocation(row: ApplicationRecord, t: (k: string) => string): string {
    const loc = row.location?.trim();
    const rem = row.remote ? t(`remote.${row.remote}`) : '';
    if (loc && rem) return `${rem} · ${loc}`;
    return loc || rem || '—';
}

export const DEFAULT_VISIBLE_COLUMNS: AppColumnId[] = APP_COLUMN_DEFS.map((c) => c.id);

/** Default full-column grid used by legacy call sites. */
export const ROW_GRID = buildAppRowGrid(DEFAULT_VISIBLE_COLUMNS);

interface Props {
    row: ApplicationRecord;
    selected?: boolean;
    visibleColumns?: AppColumnId[];
    onEdit: (row: ApplicationRecord) => void;
    onDelete: (id: string) => void;
    onStatusChange: (id: string, status: ApplicationStatus) => void;
}

export function ApplicationRow({
    row,
    selected,
    visibleColumns = DEFAULT_VISIBLE_COLUMNS,
    onEdit,
    onDelete,
    onStatusChange,
}: Props) {
    const showId = visibleColumns.includes('id');
    const showSalary = visibleColumns.includes('salary');
    const showLocation = visibleColumns.includes('location');
    const showMatch = visibleColumns.includes('match');
    const showSource = visibleColumns.includes('source');
    const showUpdated = visibleColumns.includes('updated');
    const rowGrid = buildAppRowGrid(visibleColumns);

    const { t } = useTranslation();
    const idShort = row.id?.slice(0, 8).toUpperCase() || '—';
    const initials = initialsFor(row.companyName || row.jobTitle || 'X');
    const { open: openContext, menu: contextMenu } = useContextMenu();
    const [hovered, setHovered] = useState(false);

    const rowBg = selected
        ? 'var(--row-selected)'
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
                gridTemplateColumns: rowGrid,
                alignItems: 'center',
                height: 40,
                background: rowBg,
                borderBottom: '1px solid var(--rule)',
                boxShadow: selected ? 'inset 3px 0 0 var(--accent)' : 'none',
                cursor: 'pointer',
                transition: 'background 80ms, box-shadow 80ms',
            }}
        >
            {/* 1: priority strip */}
            <div style={{ height: '100%', background: priorityColor(row.priority) }} />

            {/* 2: id */}
            {showId && (
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
            )}

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
            {showSalary && (
                <div
                    className="mono tnum"
                    style={{ fontSize: 11, color: 'var(--ink-2)', fontWeight: 500 }}
                >
                    {formatSalary(row.salaryMin, row.salaryMax, row.salaryCurrency)}
                </div>
            )}

            {/* 6: location */}
            {showLocation && (
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
            )}

            {/* 7: match */}
            {showMatch && (
                <div>
                    {row.matchScore > 0 ? (
                        <Tooltip label={row.matchReason || 'LLM score'} multiline w={280}>
                            <span>
                                <MatchScore value={row.matchScore} width={40} />
                            </span>
                        </Tooltip>
                    ) : (
                        <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)' }}>
                            -
                        </span>
                    )}
                </div>
            )}

            {/* 8: source */}
            {showSource && (
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
            )}

            {/* 9: updated */}
            {showUpdated && (
                <div
                    className="mono"
                    style={{ fontSize: 10.5, color: 'var(--ink-3)', letterSpacing: '0.02em' }}
                >
                    {formatUpdated(row.updatedAt)}
                </div>
            )}

            {/* 10: actions - sticky to right edge so they stay visible on
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

