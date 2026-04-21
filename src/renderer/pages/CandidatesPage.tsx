import {
    ActionIcon,
    Anchor,
    Badge,
    Box,
    Button,
    Center,
    Checkbox,
    Group,
    Loader,
    MultiSelect,
    NumberInput,
    Select,
    Stack,
    Text,
    TextInput,
    Title,
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

interface Props {
    onCandidateImported: (app: ApplicationRecord) => void;
    onGoToAgents: () => void;
}

function scoreColor(score: number): string {
    if (score >= 90) return 'teal';
    if (score >= 70) return 'green';
    if (score >= 50) return 'yellow';
    if (score > 0) return 'orange';
    return 'gray';
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
                    <IconSparkles size={48} style={{ opacity: 0.3 }} />
                    <Stack align="center" gap={4}>
                        <Title order={4}>{t('candidates.emptyTitle')}</Title>
                        <Text c="dimmed" ta="center" size="sm">
                            {t('candidates.emptySubtitle')}
                        </Text>
                    </Stack>
                    <Button onClick={onGoToAgents}>{t('nav.agents')}</Button>
                </Stack>
            </Center>
        );
    }

    return (
        <Stack gap="md">
            <Group justify="space-between" align="end" wrap="wrap">
                <Stack gap={2}>
                    <Title order={2}>{t('tabs.candidates')}</Title>
                    <Text c="dimmed" size="sm">
                        {filtered.length} of {candidates.filter((c) => c.status !== 'ignored').length}
                    </Text>
                </Stack>
                <Button
                    variant="subtle"
                    size="xs"
                    onClick={onGoToAgents}
                >
                    {t('nav.agents')}
                </Button>
            </Group>

            <Group gap="xs" wrap="wrap">
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
            </Group>

            {selectedIds.size > 0 && (
                <Group justify="flex-end" gap="xs">
                    <Text size="xs" c="dimmed">
                        {t('candidates.selected', { count: selectedIds.size })}
                    </Text>
                    <Button
                        size="xs"
                        variant="light"
                        leftSection={<IconStar size={14} />}
                        onClick={bulkFavorite}
                    >
                        {t('candidates.star')}
                    </Button>
                    <Button
                        size="xs"
                        variant="light"
                        color="gray"
                        leftSection={<IconEyeOff size={14} />}
                        onClick={bulkIgnore}
                    >
                        {t('candidates.dismiss')}
                    </Button>
                </Group>
            )}

            {filtered.length === 0 ? (
                <Center mih={240}>
                    <Stack align="center" gap={4}>
                        <Text c="dimmed" fw={500}>
                            {t('candidates.emptyTitle')}
                        </Text>
                        <Text size="sm" c="dimmed">
                            {t('candidates.emptySubtitle')}
                        </Text>
                    </Stack>
                </Center>
            ) : (
                <Stack
                    gap={0}
                    p={4}
                    style={{
                        borderRadius: 10,
                        border:
                            '1px solid light-dark(var(--mantine-color-gray-2), var(--mantine-color-dark-5))',
                        backgroundColor:
                            'light-dark(white, var(--mantine-color-dark-7))',
                    }}
                >
                    <Group px="sm" py="xs">
                        <Checkbox
                            size="xs"
                            checked={allSelected}
                            indeterminate={!allSelected && selectedIds.size > 0}
                            onChange={toggleSelectAll}
                        />
                        <Text size="xs" c="dimmed">
                            {filtered.length} {filtered.length === 1 ? 'match' : 'matches'}
                        </Text>
                    </Group>
                    {filtered.map((c) => (
                        <Box
                            key={c.id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                padding: '8px 12px',
                                borderRadius: 6,
                                cursor: 'pointer',
                                transition: 'background 80ms',
                            }}
                            onClick={() => window.api.shell.openExternal(c.sourceUrl)}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor =
                                    'light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-6))';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                        >
                            <Box onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                    size="xs"
                                    checked={selectedIds.has(c.id)}
                                    onChange={() => toggleSelect(c.id)}
                                />
                            </Box>

                            <Badge color={scoreColor(c.score)} variant="light" size="sm" w={42}>
                                {c.score}
                            </Badge>

                            <Box style={{ flex: 1, minWidth: 0 }}>
                                <Group gap={6} wrap="nowrap" align="baseline">
                                    <Text size="sm" fw={600} lineClamp={1}>
                                        {c.title || c.company || 'Untitled'}
                                    </Text>
                                    {c.favorite && (
                                        <IconStarFilled
                                            size={12}
                                            color="var(--mantine-color-yellow-5)"
                                        />
                                    )}
                                </Group>
                                <Group gap={8} wrap="nowrap">
                                    {c.company && (
                                        <Text size="xs" c="dimmed" lineClamp={1}>
                                            {c.company}
                                        </Text>
                                    )}
                                    {c.location && (
                                        <Text size="xs" c="dimmed" lineClamp={1}>
                                            · {c.location}
                                        </Text>
                                    )}
                                    <Text size="xs" c="dimmed">
                                        · {timeAgo(c.discoveredAt)}
                                    </Text>
                                </Group>
                                {c.scoreReason && (
                                    <Text size="xs" c="dimmed" lineClamp={1} mt={2}>
                                        {c.scoreReason}
                                    </Text>
                                )}
                            </Box>

                            <Group gap={4} wrap="nowrap" onClick={(e) => e.stopPropagation()}>
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
                                        color={c.favorite ? 'yellow' : 'gray'}
                                        onClick={async () => {
                                            await window.api.agents.updateCandidate(c.id, {
                                                favorite: !c.favorite,
                                            });
                                            await refresh();
                                        }}
                                    >
                                        {c.favorite ? (
                                            <IconStarFilled size={14} />
                                        ) : (
                                            <IconStar size={14} />
                                        )}
                                    </ActionIcon>
                                </Tooltip>
                                {c.status === 'imported' ? (
                                    <Badge
                                        size="xs"
                                        variant="light"
                                        leftSection={<IconCheck size={10} />}
                                    >
                                        {t('candidates.imported')}
                                    </Badge>
                                ) : (
                                    <>
                                        <Tooltip label={t('candidates.addAsApplication')}>
                                            <ActionIcon
                                                variant="subtle"
                                                size="sm"
                                                color="accent"
                                                onClick={async () => {
                                                    const app =
                                                        await window.api.agents.importCandidate(c.id);
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
                                                <IconPlus size={14} />
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
                                                <IconEyeOff size={14} />
                                            </ActionIcon>
                                        </Tooltip>
                                    </>
                                )}
                                <Anchor
                                    size="xs"
                                    c="dimmed"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        window.api.shell.openExternal(c.sourceUrl);
                                    }}
                                    href={c.sourceUrl}
                                >
                                    <IconArrowUpRight size={14} />
                                </Anchor>
                            </Group>
                        </Box>
                    ))}
                </Stack>
            )}
        </Stack>
    );
}
