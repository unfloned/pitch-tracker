import {
    ActionIcon,
    Anchor,
    Center,
    Group,
    Loader,
    Menu,
    Select,
    Stack,
    Table,
    Text,
    TextInput,
} from '@mantine/core';
import { IconDotsVertical, IconExternalLink, IconSearch, IconTrash } from '@tabler/icons-react';
import { useMemo, useState } from 'react';
import {
    ApplicationStatus,
    STATUS_LABEL,
    STATUS_ORDER,
} from '@shared/application';
import type { ApplicationRecord } from '../../preload/index';
import { StatusBadge } from './StatusBadge';

interface Props {
    rows: ApplicationRecord[];
    loading: boolean;
    onEdit: (row: ApplicationRecord) => void;
    onDelete: (id: string) => void;
    onStatusChange: (id: string, status: ApplicationStatus) => void;
}

export function ApplicationList({ rows, loading, onEdit, onDelete, onStatusChange }: Props) {
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

    if (loading) {
        return (
            <Center h={300}>
                <Loader />
            </Center>
        );
    }

    return (
        <Stack gap="md">
            <Group>
                <TextInput
                    placeholder="Suchen (Firma, Titel, Stack, Tags)"
                    leftSection={<IconSearch size={16} />}
                    value={query}
                    onChange={(e) => setQuery(e.currentTarget.value)}
                    flex={1}
                />
                <Select
                    placeholder="Status (alle)"
                    clearable
                    data={STATUS_ORDER.map((s) => ({ value: s, label: STATUS_LABEL[s] }))}
                    value={statusFilter}
                    onChange={setStatusFilter}
                    w={220}
                />
            </Group>

            {filtered.length === 0 ? (
                <Center h={240}>
                    <Stack align="center" gap={4}>
                        <Text c="dimmed">Keine Einträge.</Text>
                        <Text size="sm" c="dimmed">
                            Klick "Neuer Eintrag" oben rechts.
                        </Text>
                    </Stack>
                </Center>
            ) : (
                <Table striped highlightOnHover verticalSpacing="sm">
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Status</Table.Th>
                            <Table.Th>Firma</Table.Th>
                            <Table.Th>Jobtitel</Table.Th>
                            <Table.Th>Ort / Remote</Table.Th>
                            <Table.Th>Gehalt</Table.Th>
                            <Table.Th>Stack</Table.Th>
                            <Table.Th w={60}></Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {filtered.map((r) => (
                            <Table.Tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => onEdit(r)}>
                                <Table.Td onClick={(e) => e.stopPropagation()}>
                                    <Select
                                        size="xs"
                                        value={r.status}
                                        data={STATUS_ORDER.map((s) => ({
                                            value: s,
                                            label: STATUS_LABEL[s],
                                        }))}
                                        onChange={(value) => {
                                            if (value) onStatusChange(r.id, value as ApplicationStatus);
                                        }}
                                        w={180}
                                        allowDeselect={false}
                                    />
                                </Table.Td>
                                <Table.Td>
                                    <Stack gap={2}>
                                        <Text fw={500}>{r.companyName || '—'}</Text>
                                        {r.companyWebsite && (
                                            <Anchor
                                                size="xs"
                                                c="dimmed"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    window.api.shell.openExternal(r.companyWebsite);
                                                }}
                                            >
                                                {shortenUrl(r.companyWebsite)}
                                            </Anchor>
                                        )}
                                    </Stack>
                                </Table.Td>
                                <Table.Td>
                                    <Group gap={4} wrap="nowrap">
                                        <Text>{r.jobTitle || '—'}</Text>
                                        {r.jobUrl && (
                                            <ActionIcon
                                                variant="subtle"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    window.api.shell.openExternal(r.jobUrl);
                                                }}
                                            >
                                                <IconExternalLink size={14} />
                                            </ActionIcon>
                                        )}
                                    </Group>
                                </Table.Td>
                                <Table.Td>
                                    <Stack gap={0}>
                                        <Text size="sm">{r.location || '—'}</Text>
                                        <Text size="xs" c="dimmed">
                                            {remoteLabel(r.remote)}
                                        </Text>
                                    </Stack>
                                </Table.Td>
                                <Table.Td>
                                    {formatSalary(r.salaryMin, r.salaryMax, r.salaryCurrency)}
                                </Table.Td>
                                <Table.Td>
                                    <Text size="xs" c="dimmed" lineClamp={2}>
                                        {r.stack || '—'}
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
                                                    if (confirm(`"${r.companyName}" wirklich löschen?`))
                                                        onDelete(r.id);
                                                }}
                                            >
                                                Löschen
                                            </Menu.Item>
                                        </Menu.Dropdown>
                                    </Menu>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            )}

            <Text size="xs" c="dimmed">
                {filtered.length} von {rows.length} Einträgen
            </Text>
        </Stack>
    );
}

function shortenUrl(url: string): string {
    return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

function remoteLabel(r: string): string {
    if (r === 'remote') return '100% Remote';
    if (r === 'hybrid') return 'Hybrid';
    return 'Vor Ort';
}

function formatSalary(min: number, max: number, currency: string): string {
    if (!min && !max) return '—';
    const c = currency || 'EUR';
    if (min && max) return `${min}-${max} ${c}`;
    return `${min || max} ${c}`;
}
