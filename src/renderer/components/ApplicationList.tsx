import {
    ActionIcon,
    Badge,
    Box,
    Center,
    Group,
    Loader,
    Menu,
    Select,
    Stack,
    Table,
    Text,
    TextInput,
    Tooltip,
} from '@mantine/core';
import {
    IconBuildingStore,
    IconDotsVertical,
    IconExternalLink,
    IconMapPin,
    IconSearch,
    IconTargetArrow,
    IconTrash,
} from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApplicationStatus, STATUS_ORDER } from '@shared/application';
import type { ApplicationRecord } from '../../preload/index';

interface Props {
    rows: ApplicationRecord[];
    loading: boolean;
    onEdit: (row: ApplicationRecord) => void;
    onDelete: (id: string) => void;
    onStatusChange: (id: string, status: ApplicationStatus) => void;
    onVisibleCountChange?: (count: number) => void;
}

const STATUS_COLOR: Record<ApplicationStatus, string> = {
    draft: 'gray',
    applied: 'blue',
    in_review: 'cyan',
    interview_scheduled: 'grape',
    interviewed: 'violet',
    offer_received: 'teal',
    accepted: 'green',
    rejected: 'red',
    withdrawn: 'dark',
};

function scoreColor(score: number): string {
    if (score >= 90) return 'teal';
    if (score >= 70) return 'green';
    if (score >= 50) return 'yellow';
    if (score > 0) return 'orange';
    return 'gray';
}

function formatSalary(min: number, max: number, currency: string): string {
    if (!min && !max) return '';
    const c = currency || 'EUR';
    if (min && max) return `${(min / 1000).toFixed(0)}-${(max / 1000).toFixed(0)}k ${c}`;
    return `${((min || max) / 1000).toFixed(0)}k ${c}`;
}

export function ApplicationList({
    rows,
    loading,
    onEdit,
    onDelete,
    onStatusChange,
    onVisibleCountChange,
}: Props) {
    const { t } = useTranslation();
    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

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
        onVisibleCountChange?.(filtered.length);
    }, [filtered.length, onVisibleCountChange]);

    if (loading) {
        return (
            <Center h={300}>
                <Loader />
            </Center>
        );
    }

    const statusOptions = STATUS_ORDER.map((s) => ({ value: s, label: t(`status.${s}`) }));

    return (
        <Stack gap="md">
            <Group>
                <TextInput
                    placeholder={t('applications.searchPlaceholder')}
                    leftSection={<IconSearch size={16} />}
                    value={query}
                    onChange={(e) => setQuery(e.currentTarget.value)}
                    flex={1}
                />
                <Select
                    placeholder={t('applications.allStatuses')}
                    clearable
                    data={statusOptions}
                    value={statusFilter}
                    onChange={setStatusFilter}
                    w={220}
                />
            </Group>

            {filtered.length === 0 ? (
                <Center h={260}>
                    <Stack align="center" gap={6}>
                        <IconBuildingStore size={40} style={{ opacity: 0.3 }} />
                        <Text c="dimmed" fw={500}>
                            {t('applications.emptyTitle')}
                        </Text>
                        <Text size="sm" c="dimmed">
                            {t('applications.emptySubtitle')}
                        </Text>
                    </Stack>
                </Center>
            ) : (
                <Box
                    style={{
                        borderRadius: 8,
                        overflow: 'hidden',
                        border:
                            '1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))',
                    }}
                >
                    <Table verticalSpacing="md" horizontalSpacing="md" highlightOnHover>
                        <Table.Thead
                            style={{
                                backgroundColor:
                                    'light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-6))',
                                borderBottom:
                                    '1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))',
                            }}
                        >
                            <Table.Tr>
                                <Table.Th style={{ width: 180 }}>
                                    {t('applications.table.status')}
                                </Table.Th>
                                <Table.Th style={{ width: 70 }}>
                                    {t('applications.table.match')}
                                </Table.Th>
                                <Table.Th>{t('applications.table.companyJob')}</Table.Th>
                                <Table.Th style={{ width: 160 }}>
                                    {t('applications.table.location')}
                                </Table.Th>
                                <Table.Th style={{ width: 140 }}>
                                    {t('applications.table.salary')}
                                </Table.Th>
                                <Table.Th>{t('applications.table.stack')}</Table.Th>
                                <Table.Th style={{ width: 60 }}></Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {filtered.map((r) => (
                                <Table.Tr
                                    key={r.id}
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => onEdit(r)}
                                >
                                    <Table.Td onClick={(e) => e.stopPropagation()}>
                                        <Select
                                            size="xs"
                                            value={r.status}
                                            data={statusOptions}
                                            onChange={(value) => {
                                                if (value)
                                                    onStatusChange(r.id, value as ApplicationStatus);
                                            }}
                                            w={160}
                                            allowDeselect={false}
                                            renderOption={({ option }) => (
                                                <Group gap={6}>
                                                    <Box
                                                        w={8}
                                                        h={8}
                                                        style={{
                                                            borderRadius: '50%',
                                                            backgroundColor: `var(--mantine-color-${STATUS_COLOR[option.value as ApplicationStatus]}-5)`,
                                                        }}
                                                    />
                                                    <Text size="xs">{option.label}</Text>
                                                </Group>
                                            )}
                                        />
                                    </Table.Td>
                                    <Table.Td>
                                        {r.matchScore > 0 ? (
                                            <Tooltip
                                                label={r.matchReason || 'LLM score'}
                                                multiline
                                                w={280}
                                            >
                                                <Badge
                                                    color={scoreColor(r.matchScore)}
                                                    variant="filled"
                                                    size="md"
                                                    leftSection={<IconTargetArrow size={10} />}
                                                >
                                                    {r.matchScore}
                                                </Badge>
                                            </Tooltip>
                                        ) : (
                                            <Text size="xs" c="dimmed">
                                                -
                                            </Text>
                                        )}
                                    </Table.Td>
                                    <Table.Td>
                                        <Stack gap={2}>
                                            <Group gap={6} wrap="nowrap">
                                                <Text fw={600} size="sm" lineClamp={1}>
                                                    {r.companyName || t('applications.table.noCompany')}
                                                </Text>
                                                {r.jobUrl && (
                                                    <ActionIcon
                                                        variant="subtle"
                                                        size="xs"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            window.api.shell.openExternal(r.jobUrl);
                                                        }}
                                                    >
                                                        <IconExternalLink size={12} />
                                                    </ActionIcon>
                                                )}
                                            </Group>
                                            <Text size="xs" c="dimmed" lineClamp={1}>
                                                {r.jobTitle || t('applications.table.noTitle')}
                                            </Text>
                                        </Stack>
                                    </Table.Td>
                                    <Table.Td>
                                        <Stack gap={2}>
                                            {r.location && (
                                                <Group gap={4} wrap="nowrap">
                                                    <IconMapPin size={12} style={{ opacity: 0.5 }} />
                                                    <Text size="xs" lineClamp={1}>
                                                        {r.location}
                                                    </Text>
                                                </Group>
                                            )}
                                            <Badge
                                                color={
                                                    r.remote === 'remote'
                                                        ? 'green'
                                                        : r.remote === 'hybrid'
                                                          ? 'yellow'
                                                          : 'gray'
                                                }
                                                variant="light"
                                                size="xs"
                                                style={{ width: 'fit-content' }}
                                            >
                                                {t(`remote.${r.remote}`)}
                                            </Badge>
                                        </Stack>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="xs" c={r.salaryMax > 0 ? undefined : 'dimmed'}>
                                            {formatSalary(
                                                r.salaryMin,
                                                r.salaryMax,
                                                r.salaryCurrency,
                                            ) || '-'}
                                        </Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="xs" c="dimmed" lineClamp={2}>
                                            {r.stack || '-'}
                                        </Text>
                                    </Table.Td>
                                    <Table.Td onClick={(e) => e.stopPropagation()}>
                                        <Menu position="bottom-end" withArrow>
                                            <Menu.Target>
                                                <ActionIcon variant="subtle">
                                                    <IconDotsVertical size={16} />
                                                </ActionIcon>
                                            </Menu.Target>
                                            <Menu.Dropdown>
                                                <Menu.Item
                                                    color="red"
                                                    leftSection={<IconTrash size={14} />}
                                                    onClick={() => {
                                                        if (
                                                            confirm(
                                                                t('confirm.deleteApplication', {
                                                                    name: r.companyName,
                                                                }),
                                                            )
                                                        )
                                                            onDelete(r.id);
                                                    }}
                                                >
                                                    {t('common.delete')}
                                                </Menu.Item>
                                            </Menu.Dropdown>
                                        </Menu>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                </Box>
            )}

            {filtered.length > 0 && rows.length > filtered.length && (
                <Text size="xs" c="dimmed" ta="center">
                    {t('applications.showing', { filtered: filtered.length, total: rows.length })}
                </Text>
            )}
        </Stack>
    );
}
