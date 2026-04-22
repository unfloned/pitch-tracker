import { Switch, Tooltip } from '@mantine/core';
import {
    IconPlayerPlay,
    IconPlayerStop,
    IconPencil,
    IconTrash,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { SerializedJobSearch } from '@shared/job-search';
import { GhostBtn } from '../primitives/GhostBtn';
import { Label } from '../primitives/Label';
import { useContextMenu } from '../primitives/ContextMenu';

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

function timeUntil(iso: string | null, fallback: string): string {
    if (!iso) return fallback;
    const diff = new Date(iso).getTime() - Date.now();
    if (diff <= 0) return 'now';
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `in ${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `in ${hours}h`;
    const days = Math.floor(hours / 24);
    return `in ${days}d`;
}

/**
 * Synthetic sparkline from a string seed. No historical run data available
 * in the current schema; this visualises cadence via the search's identity.
 * Replaced when agent run history is wired up.
 */
function sparklinePoints(seed: string, count = 40): number[] {
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
    const vals: number[] = [];
    for (let i = 0; i < count; i++) {
        const s = Math.sin(i * 0.5 + h) * 0.45;
        const c = Math.cos(i * 0.3 + h * 2) * 0.25;
        const spike = i % 7 === 0 ? 0.3 : 0;
        vals.push(Math.abs(s + c) + spike);
    }
    return vals;
}

interface Props {
    search: SerializedJobSearch;
    isRunning: boolean;
    onEdit: () => void;
    onDelete: () => void;
    onRun: () => void;
    onCancel: () => void;
    onToggleEnabled: (enabled: boolean) => void;
}

export function SearchRow({
    search,
    isRunning,
    onEdit,
    onDelete,
    onRun,
    onCancel,
    onToggleEnabled,
}: Props) {
    const { t } = useTranslation();
    const { open: openContext, menu: contextMenu } = useContextMenu();
    const spark = sparklinePoints(search.id);

    return (
        <>
            {contextMenu}
            <div
                onClick={onEdit}
                onContextMenu={(e) =>
                    openContext(e, [
                        {
                            label: t('common.edit'),
                            icon: <IconPencil size={13} />,
                            onClick: onEdit,
                        },
                        {
                            label: isRunning
                                ? t('candidates.cancelRun')
                                : t('candidates.runNow'),
                            icon: isRunning ? (
                                <IconPlayerStop size={13} />
                            ) : (
                                <IconPlayerPlay size={13} />
                            ),
                            onClick: isRunning ? onCancel : onRun,
                        },
                        {
                            label: t('common.delete'),
                            icon: <IconTrash size={13} />,
                            danger: true,
                            onClick: () => {
                                if (
                                    confirm(
                                        t('confirm.deleteSearch', { label: search.label }),
                                    )
                                ) {
                                    onDelete();
                                }
                            },
                        },
                    ])
                }
                style={{
                    background: 'var(--card)',
                    border: '1px solid var(--rule)',
                    cursor: 'pointer',
                    transition: 'border-color 100ms',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--rule-strong)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--rule)';
                }}
            >
                {/* top row */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns:
                            '16px minmax(200px, 1fr) 110px 110px 120px auto',
                        gap: 14,
                        padding: '12px 16px',
                        alignItems: 'center',
                    }}
                >
                    {/* enabled dot */}
                    <div
                        style={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            background: isRunning
                                ? 'var(--accent)'
                                : search.enabled
                                  ? 'var(--moss)'
                                  : 'var(--rule-strong)',
                        }}
                    />

                    {/* name + sources */}
                    <div style={{ minWidth: 0 }}>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                marginBottom: 2,
                            }}
                        >
                            <span
                                style={{
                                    fontSize: 14,
                                    color: 'var(--ink)',
                                    fontWeight: 600,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    minWidth: 0,
                                }}
                            >
                                {search.label}
                            </span>
                            {isRunning && (
                                <span
                                    className="mono"
                                    style={{
                                        fontSize: 9.5,
                                        fontWeight: 600,
                                        padding: '1px 5px',
                                        background: 'var(--accent)',
                                        color: 'var(--ink)',
                                        letterSpacing: '0.06em',
                                    }}
                                >
                                    RUNNING
                                </span>
                            )}
                        </div>
                        <div
                            className="mono"
                            style={{
                                fontSize: 10.5,
                                color: 'var(--ink-3)',
                                letterSpacing: '0.02em',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {search.sources.slice(0, 4).map((s) => `[${s}]`).join(' ')}
                            {search.sources.length > 4 && ` +${search.sources.length - 4}`}
                            {search.keywords && (
                                <span style={{ color: 'var(--ink-4)' }}>
                                    {' · '}
                                    {search.keywords}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* interval */}
                    <div>
                        <Label>Interval</Label>
                        <div
                            className="mono tnum"
                            style={{
                                fontSize: 12,
                                color: 'var(--ink-2)',
                                marginTop: 2,
                                fontWeight: 500,
                            }}
                        >
                            {t(`interval.${search.interval}`)}
                        </div>
                    </div>

                    {/* last run */}
                    <div>
                        <Label>Last run</Label>
                        <div
                            className="mono"
                            style={{
                                fontSize: 11.5,
                                color: 'var(--ink-3)',
                                marginTop: 2,
                            }}
                        >
                            {search.lastRunAt ? timeAgo(search.lastRunAt) : '—'}
                        </div>
                    </div>

                    {/* next run */}
                    <div>
                        <Label>Next</Label>
                        <div
                            className="mono"
                            style={{
                                fontSize: 11.5,
                                color: 'var(--ink-3)',
                                marginTop: 2,
                            }}
                        >
                            {search.enabled && search.interval !== 'manual'
                                ? timeUntil(search.nextRunAt, t('interval.manual'))
                                : t('interval.manual')}
                        </div>
                    </div>

                    {/* actions */}
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                        <Tooltip
                            label={search.enabled ? 'Enabled' : 'Paused'}
                        >
                            <Switch
                                size="xs"
                                checked={search.enabled}
                                onChange={(e) => onToggleEnabled(e.currentTarget.checked)}
                            />
                        </Tooltip>
                        {isRunning ? (
                            <GhostBtn onClick={onCancel}>
                                <IconPlayerStop size={12} />
                                <span>Stop</span>
                            </GhostBtn>
                        ) : (
                            <GhostBtn onClick={onRun}>
                                <IconPlayerPlay size={12} />
                                <span>Run</span>
                            </GhostBtn>
                        )}
                    </div>
                </div>

                {/* sparkline */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'flex-end',
                        gap: 2,
                        height: 24,
                        padding: '0 16px 10px',
                    }}
                >
                    {spark.map((v, i) => (
                        <div
                            key={i}
                            style={{
                                flex: 1,
                                height: Math.max(2, v * 18),
                                background:
                                    i > spark.length - 5
                                        ? 'var(--accent)'
                                        : 'var(--ink-3)',
                                opacity: search.enabled ? 0.55 : 0.25,
                            }}
                        />
                    ))}
                </div>
            </div>
        </>
    );
}
