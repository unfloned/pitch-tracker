import {
    ActionIcon,
    Center,
    Checkbox,
    Loader,
    MultiSelect,
    NumberInput,
    Select,
    Stack,
    TextInput,
    Tooltip,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
    IconArrowUpRight,
    IconCheck,
    IconEyeOff,
    IconPlus,
    IconSearch,
    IconSparkles,
    IconStar,
    IconStarFilled,
} from '@tabler/icons-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ApplicationRecord } from '../../preload/index';
import type { SerializedJobCandidate } from '@shared/job-search';
import { ALL_JOB_SOURCES } from '@shared/job-search';
import { CandidateDrawer } from '../components/CandidateDrawer';
import { GhostBtn } from '../components/primitives/GhostBtn';
import { Label } from '../components/primitives/Label';
import { MatchScore } from '../components/primitives/MatchScore';

interface Props {
    onCandidateImported: (app: ApplicationRecord) => void;
    onGoToAgents: () => void;
}

function timeAgo(iso: string): string {
    const diffMs = Date.now() - new Date(iso).getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(iso).toLocaleDateString();
}

export function CandidatesPage({ onCandidateImported, onGoToAgents }: Props) {
    const { t } = useTranslation();
    const [candidates, setCandidates] = useState<SerializedJobCandidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [minScore, setMinScore] = useState(50);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [sourceFilter, setSourceFilter] = useState<string[]>([]);
    const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'favorite' | 'imported'>('all');
    const [sortBy, setSortBy] = useState<'score_desc' | 'score_asc' | 'date_desc' | 'company_asc'>(
        'score_desc',
    );
    const [searchText, setSearchText] = useState('');
    const [drawerCandidate, setDrawerCandidate] = useState<SerializedJobCandidate | null>(null);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const c = await window.api.agents.listCandidates(0);
            setCandidates(c);
        } catch (err) {
            notifications.show({
                color: 'red',
                title: t('notifications.loadFailed'),
                message: (err as Error).message,
            });
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        refresh();
        const offCandidateAdded = window.api.on('agents:candidateAdded', () => {
            refresh();
        });
        const offFinished = window.api.on('agents:runFinished', () => {
            refresh();
        });
        return () => {
            offCandidateAdded();
            offFinished();
        };
    }, [refresh]);

    const filtered = useMemo(() => {
        const q = searchText.toLowerCase().trim();
        let list = candidates.filter((c) => {
            if (c.score < minScore) return false;
            if (statusFilter === 'new' && c.status !== 'new') return false;
            if (statusFilter === 'favorite' && !c.favorite) return false;
            if (statusFilter === 'imported' && c.status !== 'imported') return false;
            if (statusFilter === 'all' && c.status === 'ignored') return false;
            if (sourceFilter.length > 0) {
                const matches = sourceFilter.some((src) => c.sourceKey.startsWith(src + ':'));
                if (!matches) return false;
            }
            if (q) {
                const blob = `${c.company} ${c.title} ${c.location}`.toLowerCase();
                if (!blob.includes(q)) return false;
            }
            return true;
        });
        list = [...list].sort((a, b) => {
            if (sortBy === 'score_desc') return b.score - a.score;
            if (sortBy === 'score_asc') return a.score - b.score;
            if (sortBy === 'date_desc')
                return new Date(b.discoveredAt).getTime() - new Date(a.discoveredAt).getTime();
            if (sortBy === 'company_asc') return (a.company || '').localeCompare(b.company || '');
            return 0;
        });
        return list;
    }, [candidates, minScore, statusFilter, sourceFilter, sortBy, searchText]);

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const allSelected =
        filtered.length > 0 && filtered.every((c) => selectedIds.has(c.id));

    const toggleSelectAll = () => {
        setSelectedIds(allSelected ? new Set() : new Set(filtered.map((c) => c.id)));
    };

    const bulkIgnore = async () => {
        await window.api.agents.bulkUpdateCandidates([...selectedIds], { status: 'ignored' });
        setSelectedIds(new Set());
        await refresh();
    };

    const bulkFavorite = async () => {
        await window.api.agents.bulkUpdateCandidates([...selectedIds], { favorite: true });
        setSelectedIds(new Set());
        await refresh();
    };

    if (loading) {
        return (
            <Center mih={400}>
                <Loader />
            </Center>
        );
    }

    if (candidates.length === 0) {
        return (
            <Center mih={400}>
                <Stack align="center" gap="md" maw={420}>
                    <IconSparkles size={48} style={{ opacity: 0.3, color: 'var(--ink-4)' }} />
                    <div style={{ textAlign: 'center' }}>
                        <div
                            className="serif"
                            style={{ fontSize: 19, fontWeight: 500, color: 'var(--ink)' }}
                        >
                            {t('candidates.emptyTitle')}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4 }}>
                            {t('candidates.emptySubtitle')}
                        </div>
                    </div>
                    <GhostBtn
                        active
                        onClick={onGoToAgents}
                        style={{
                            background: 'var(--ink)',
                            color: 'var(--paper)',
                            borderColor: 'var(--ink)',
                        }}
                    >
                        <span>{t('nav.agents')}</span>
                    </GhostBtn>
                </Stack>
            </Center>
        );
    }

    return (
        <Stack gap="md">
            <div>
                <Label>{t('tabs.candidates')}</Label>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: 10,
                        marginTop: 4,
                    }}
                >
                    <span
                        className="serif"
                        style={{
                            fontSize: 28,
                            fontWeight: 500,
                            color: 'var(--ink)',
                            letterSpacing: '-0.02em',
                            lineHeight: 1,
                        }}
                    >
                        {t('tabs.candidates')}
                    </span>
                    <span
                        className="mono"
                        style={{ fontSize: 11, color: 'var(--ink-3)' }}
                    >
                        {filtered.length} of{' '}
                        {candidates.filter((c) => c.status !== 'ignored').length}
                    </span>
                    <div style={{ flex: 1 }} />
                    <GhostBtn onClick={onGoToAgents}>
                        <span>{t('nav.agents')}</span>
                    </GhostBtn>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <TextInput
                    leftSection={<IconSearch size={14} />}
                    placeholder={t('candidates.filterSearchPlaceholder')}
                    value={searchText}
                    onChange={(e) => setSearchText(e.currentTarget.value)}
                    style={{ flex: 1, minWidth: 200 }}
                    size="sm"
                />
                <MultiSelect
                    placeholder={t('candidates.filterSource')}
                    data={ALL_JOB_SOURCES.map((s) => ({ value: s, label: t(`source.${s}`) }))}
                    value={sourceFilter}
                    onChange={setSourceFilter}
                    clearable
                    size="sm"
                    w={220}
                    hidePickedOptions
                />
                <Select
                    data={[
                        { value: 'all', label: t('candidates.filterStatusAll') },
                        { value: 'new', label: t('candidates.filterStatusNew') },
                        { value: 'favorite', label: t('candidates.filterStatusFavorite') },
                        { value: 'imported', label: t('candidates.filterStatusImported') },
                    ]}
                    value={statusFilter}
                    onChange={(v) => v && setStatusFilter(v as typeof statusFilter)}
                    size="sm"
                    w={150}
                    allowDeselect={false}
                />
                <Select
                    data={[
                        { value: 'score_desc', label: t('candidates.sortByScore') },
                        { value: 'score_asc', label: t('candidates.sortByScoreAsc') },
                        { value: 'date_desc', label: t('candidates.sortByDate') },
                        { value: 'company_asc', label: t('candidates.sortByCompany') },
                    ]}
                    value={sortBy}
                    onChange={(v) => v && setSortBy(v as typeof sortBy)}
                    size="sm"
                    w={200}
                    allowDeselect={false}
                />
                <NumberInput
                    value={minScore}
                    onChange={(v) => setMinScore(Number(v) || 0)}
                    min={0}
                    max={100}
                    size="sm"
                    w={100}
                    placeholder={t('candidates.minScore')}
                />
            </div>

            {selectedIds.size > 0 && (
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        gap: 8,
                    }}
                >
                    <span
                        className="mono"
                        style={{ fontSize: 11, color: 'var(--ink-3)' }}
                    >
                        {t('candidates.selected', { count: selectedIds.size })}
                    </span>
                    <GhostBtn onClick={bulkFavorite}>
                        <IconStar size={12} />
                        <span>{t('candidates.star')}</span>
                    </GhostBtn>
                    <GhostBtn onClick={bulkIgnore}>
                        <IconEyeOff size={12} />
                        <span>{t('candidates.dismiss')}</span>
                    </GhostBtn>
                </div>
            )}

            {filtered.length === 0 ? (
                <div
                    style={{
                        padding: 32,
                        textAlign: 'center',
                        border: '1px solid var(--rule)',
                        background: 'var(--card)',
                    }}
                >
                    <div
                        className="serif"
                        style={{
                            fontSize: 17,
                            fontWeight: 500,
                            color: 'var(--ink)',
                        }}
                    >
                        {t('candidates.emptyTitle')}
                    </div>
                    <div
                        style={{
                            fontSize: 12.5,
                            color: 'var(--ink-3)',
                            marginTop: 6,
                        }}
                    >
                        {t('candidates.emptySubtitle')}
                    </div>
                </div>
            ) : (
                <div
                    style={{
                        border: '1px solid var(--rule)',
                        background: 'var(--card)',
                    }}
                >
                    {/* header row */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '6px 12px',
                            borderBottom: '1px solid var(--rule-strong)',
                            background: 'var(--paper-2)',
                        }}
                    >
                        <Checkbox
                            size="xs"
                            checked={allSelected}
                            indeterminate={!allSelected && selectedIds.size > 0}
                            onChange={toggleSelectAll}
                        />
                        <Label>
                            {filtered.length}{' '}
                            {filtered.length === 1 ? 'match' : 'matches'}
                        </Label>
                    </div>

                    {filtered.map((c) => (
                        <div
                            key={c.id}
                            onClick={() => setDrawerCandidate(c)}
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
                                    checked={selectedIds.has(c.id)}
                                    onChange={() => toggleSelect(c.id)}
                                />
                            </div>

                            <div style={{ flexShrink: 0 }}>
                                <MatchScore value={c.score} width={36} />
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                    }}
                                >
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
                                    label={
                                        c.favorite
                                            ? t('candidates.removeStar')
                                            : t('candidates.star')
                                    }
                                >
                                    <ActionIcon
                                        variant="subtle"
                                        size="sm"
                                        color="gray"
                                        onClick={async () => {
                                            await window.api.agents.updateCandidate(c.id, {
                                                favorite: !c.favorite,
                                            });
                                            await refresh();
                                        }}
                                    >
                                        {c.favorite ? (
                                            <IconStarFilled
                                                size={13}
                                                style={{ color: 'var(--accent)' }}
                                            />
                                        ) : (
                                            <IconStar size={13} />
                                        )}
                                    </ActionIcon>
                                </Tooltip>
                                {c.status === 'imported' ? (
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
                                        {t('candidates.imported')}
                                    </span>
                                ) : (
                                    <>
                                        <Tooltip label={t('candidates.addAsApplication')}>
                                            <ActionIcon
                                                variant="subtle"
                                                size="sm"
                                                color="gray"
                                                onClick={async () => {
                                                    const app =
                                                        await window.api.agents.importCandidate(
                                                            c.id,
                                                        );
                                                    onCandidateImported(app);
                                                    notifications.show({
                                                        color: 'green',
                                                        message: t('candidates.candidateAdded', {
                                                            name: c.company || c.title,
                                                        }),
                                                    });
                                                    await refresh();
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
                                                    await refresh();
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
                    ))}
                </div>
            )}
            <CandidateDrawer
                candidate={
                    drawerCandidate
                        ? candidates.find((c) => c.id === drawerCandidate.id) ?? drawerCandidate
                        : null
                }
                opened={!!drawerCandidate}
                onClose={() => setDrawerCandidate(null)}
                onImport={async (cand) => {
                    const app = await window.api.agents.importCandidate(cand.id);
                    onCandidateImported(app);
                    notifications.show({
                        color: 'green',
                        message: t('candidates.candidateAdded', {
                            name: cand.company || cand.title,
                        }),
                    });
                    setDrawerCandidate(null);
                    await refresh();
                }}
                onDismiss={async (cand) => {
                    await window.api.agents.updateCandidate(cand.id, { status: 'ignored' });
                    setDrawerCandidate(null);
                    await refresh();
                }}
                onToggleFavorite={async (cand) => {
                    await window.api.agents.updateCandidate(cand.id, {
                        favorite: !cand.favorite,
                    });
                    await refresh();
                }}
            />
        </Stack>
    );
}
