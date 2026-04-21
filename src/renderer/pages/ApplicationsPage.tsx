import {
    ActionIcon,
    Box,
    Button,
    Center,
    Group,
    Loader,
    SegmentedControl,
    Select,
    Stack,
    Text,
    TextInput,
    Title,
} from '@mantine/core';
import { IconBriefcase, IconLayoutKanban, IconList, IconPlus, IconSearch } from '@tabler/icons-react';
import { RefObject, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ApplicationRecord } from '../../preload/index';
import type { ApplicationStatus } from '@shared/application';
import { STATUS_ORDER } from '@shared/application';
import { ApplicationRow } from '../components/ApplicationRow';
import { ApplicationBoard } from '../components/ApplicationBoard';
import { ApplicationFormModal } from '../components/ApplicationForm';

type ViewMode = 'list' | 'board';

type GroupKey = 'draft' | 'active' | 'waiting' | 'interviewing' | 'decision' | 'closed';

const GROUP_ORDER: GroupKey[] = [
    'decision',
    'interviewing',
    'waiting',
    'active',
    'draft',
    'closed',
];

const GROUP_STATUS_MAP: Record<GroupKey, ApplicationStatus[]> = {
    draft: ['draft'],
    active: ['applied', 'in_review'],
    waiting: ['applied'],
    interviewing: ['interview_scheduled', 'interviewed'],
    decision: ['offer_received'],
    closed: ['accepted', 'rejected', 'withdrawn'],
};

interface Props {
    rows: ApplicationRecord[];
    loading: boolean;
    onEdit: (row: ApplicationRecord) => void;
    onDelete: (id: string) => void;
    onStatusChange: (id: string, status: ApplicationStatus) => void;
    onNew: () => void;
    onVisibleCountChange: (count: number) => void;
    searchInputRef: RefObject<HTMLInputElement | null>;
    detailRecord: ApplicationRecord | null;
    detailOpen: boolean;
    onCloseDetail: () => void;
    onSavedDetail: () => void;
}

export function ApplicationsPage({
    rows,
    loading,
    onEdit,
    onDelete,
    onStatusChange,
    onNew,
    onVisibleCountChange,
    searchInputRef,
    detailRecord,
    detailOpen,
    onCloseDetail,
    onSavedDetail,
}: Props) {
    const { t } = useTranslation();
    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [view, setView] = useState<ViewMode>('list');

    const filtered = useMemo(() => {
        const q = query.toLowerCase().trim();
        return rows.filter((r) => {
            if (statusFilter && r.status !== statusFilter) return false;
            if (!q) return true;
            return (
                r.companyName.toLowerCase().includes(q) ||
                r.jobTitle.toLowerCase().includes(q) ||
                r.location.toLowerCase().includes(q) ||
                r.stack.toLowerCase().includes(q) ||
                r.tags.toLowerCase().includes(q)
            );
        });
    }, [rows, query, statusFilter]);

    useEffect(() => {
        onVisibleCountChange(filtered.length);
    }, [filtered.length, onVisibleCountChange]);

    const grouped = useMemo(() => {
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const groups: Record<GroupKey, ApplicationRecord[]> = {
            decision: [],
            interviewing: [],
            waiting: [],
            active: [],
            draft: [],
            closed: [],
        };
        for (const r of filtered) {
            if (r.status === 'offer_received') {
                groups.decision.push(r);
            } else if (r.status === 'interview_scheduled' || r.status === 'interviewed') {
                groups.interviewing.push(r);
            } else if (
                r.status === 'applied' &&
                r.appliedAt &&
                new Date(r.appliedAt).getTime() < sevenDaysAgo
            ) {
                groups.waiting.push(r);
            } else if (r.status === 'applied' || r.status === 'in_review') {
                groups.active.push(r);
            } else if (r.status === 'draft') {
                groups.draft.push(r);
            } else {
                groups.closed.push(r);
            }
        }
        return groups;
    }, [filtered]);

    if (loading) {
        return (
            <Center mih={400}>
                <Loader />
            </Center>
        );
    }

    const statusOptions = STATUS_ORDER.map((s) => ({ value: s, label: t(`status.${s}`) }));

    const emptyState = (
        <Center mih={380}>
            <Stack align="center" gap="md" maw={380}>
                <IconBriefcase size={48} style={{ opacity: 0.3 }} />
                <Stack align="center" gap={4}>
                    <Title order={4}>{t('applications.emptyTitle')}</Title>
                    <Text c="dimmed" ta="center" size="sm">
                        {t('applications.emptySubtitle')}
                    </Text>
                </Stack>
                <Button leftSection={<IconPlus size={16} />} onClick={onNew}>
                    {t('toolbar.newEntry')}
                </Button>
            </Stack>
        </Center>
    );

    if (rows.length === 0) {
        return emptyState;
    }

    return (
        <Stack gap="md">
            <Group justify="space-between" align="end" wrap="wrap">
                <Stack gap={2}>
                    <Title order={2}>{t('tabs.applications')}</Title>
                    <Text c="dimmed" size="sm">
                        {filtered.length} of {rows.length}
                    </Text>
                </Stack>
                <Group gap="xs">
                    <SegmentedControl
                        value={view}
                        onChange={(v) => setView(v as ViewMode)}
                        size="xs"
                        data={[
                            {
                                value: 'list',
                                label: (
                                    <span
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 4,
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        <IconList size={14} />
                                        {t('applications.viewList')}
                                    </span>
                                ),
                            },
                            {
                                value: 'board',
                                label: (
                                    <span
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 4,
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        <IconLayoutKanban size={14} />
                                        {t('applications.viewBoard')}
                                    </span>
                                ),
                            },
                        ]}
                    />
                    <Button leftSection={<IconPlus size={14} />} size="xs" onClick={onNew}>
                        {t('toolbar.newEntry')}
                    </Button>
                </Group>
            </Group>

            <Group gap="xs">
                <TextInput
                    ref={searchInputRef as React.RefObject<HTMLInputElement>}
                    placeholder={t('applications.searchPlaceholder')}
                    leftSection={<IconSearch size={14} />}
                    value={query}
                    onChange={(e) => setQuery(e.currentTarget.value)}
                    flex={1}
                    size="sm"
                />
                <Select
                    placeholder={t('applications.allStatuses')}
                    clearable
                    size="sm"
                    data={statusOptions}
                    value={statusFilter}
                    onChange={setStatusFilter}
                    w={200}
                />
            </Group>

            {filtered.length === 0 ? (
                <Center mih={240}>
                    <Stack align="center" gap={4}>
                        <Text c="dimmed" fw={500}>
                            {t('applications.noMatch')}
                        </Text>
                        <Text size="sm" c="dimmed">
                            {t('applications.noMatchSub')}
                        </Text>
                    </Stack>
                </Center>
            ) : view === 'board' ? (
                <ApplicationBoard rows={filtered} onEdit={onEdit} onStatusChange={onStatusChange} />
            ) : (
                <Stack gap="lg">
                    {GROUP_ORDER.map((key) => {
                        const items = grouped[key];
                        if (items.length === 0) return null;
                        return (
                            <Box key={key}>
                                <Group gap={6} mb="xs">
                                    <Text
                                        size="xs"
                                        fw={600}
                                        c="dimmed"
                                        tt="uppercase"
                                        style={{ letterSpacing: '0.05em' }}
                                    >
                                        {t(`applications.group${capitalize(key)}`)}
                                    </Text>
                                    <Text size="xs" c="dimmed">
                                        · {items.length}
                                    </Text>
                                </Group>
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
                                    {items.map((r) => (
                                        <ApplicationRow
                                            key={r.id}
                                            row={r}
                                            onEdit={onEdit}
                                            onDelete={onDelete}
                                            onStatusChange={onStatusChange}
                                        />
                                    ))}
                                </Stack>
                            </Box>
                        );
                    })}
                </Stack>
            )}

            <ApplicationFormModal
                opened={detailOpen}
                onClose={onCloseDetail}
                initial={detailRecord}
                onSaved={onSavedDetail}
                onDelete={onDelete}
            />
        </Stack>
    );
}

function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}
