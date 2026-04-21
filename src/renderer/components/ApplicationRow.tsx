import { ActionIcon, Badge, Box, Group, Menu, Text, Tooltip } from '@mantine/core';
import {
    IconDotsVertical,
    IconExternalLink,
    IconMapPin,
    IconTargetArrow,
    IconTrash,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { ApplicationRecord } from '../../preload/index';
import type { ApplicationStatus } from '@shared/application';
import { StatusSelector } from './StatusSelector';

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

function initialsFor(name: string): string {
    if (!name) return '?';
    const clean = name.replace(/\s+(GmbH|AG|SE|Ltd|LLC|Inc\.?)$/i, '').trim();
    const words = clean.split(/\s+/).filter(Boolean);
    if (words.length === 0) return '?';
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
}

function colorFromName(name: string): string {
    const colors = ['blue', 'cyan', 'grape', 'violet', 'teal', 'green', 'orange', 'pink'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
    return colors[Math.abs(hash) % colors.length];
}

interface Props {
    row: ApplicationRecord;
    onEdit: (row: ApplicationRecord) => void;
    onDelete: (id: string) => void;
    onStatusChange: (id: string, status: ApplicationStatus) => void;
}

export function ApplicationRow({ row, onEdit, onDelete, onStatusChange }: Props) {
    const { t } = useTranslation();
    const avatarColor = colorFromName(row.companyName || row.jobTitle || 'X');
    const initials = initialsFor(row.companyName || row.jobTitle || 'X');
    const salary = formatSalary(row.salaryMin, row.salaryMax, row.salaryCurrency);

    return (
        <Box
            onClick={() => onEdit(row)}
            className="app-row"
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '8px 12px',
                borderRadius: 6,
                cursor: 'pointer',
                transition: 'background 80ms',
                minHeight: 44,
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                    'light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-6))';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
            }}
        >
            <Box
                w={28}
                h={28}
                style={{
                    borderRadius: 6,
                    backgroundColor: `var(--mantine-color-${avatarColor}-1)`,
                    color: `var(--mantine-color-${avatarColor}-8)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    flexShrink: 0,
                }}
            >
                {initials}
            </Box>

            <Box style={{ flex: 1, minWidth: 0 }}>
                <Group gap={6} wrap="nowrap" align="baseline">
                    <Text size="sm" fw={600} lineClamp={1} style={{ minWidth: 0 }}>
                        {row.companyName || t('applications.table.noCompany')}
                    </Text>
                    <Text size="xs" c="dimmed" lineClamp={1} style={{ minWidth: 0 }}>
                        {row.jobTitle || t('applications.table.noTitle')}
                    </Text>
                </Group>
                <Group gap={10} mt={2}>
                    {row.location && (
                        <Group gap={3} wrap="nowrap">
                            <IconMapPin size={11} style={{ opacity: 0.5 }} />
                            <Text size="xs" c="dimmed" lineClamp={1}>
                                {row.location}
                            </Text>
                        </Group>
                    )}
                    <Text
                        size="xs"
                        c={
                            row.remote === 'remote'
                                ? 'green'
                                : row.remote === 'hybrid'
                                  ? 'yellow'
                                  : 'dimmed'
                        }
                        fw={500}
                    >
                        {t(`remote.${row.remote}`)}
                    </Text>
                    {salary && (
                        <Text size="xs" c="dimmed">
                            {salary}
                        </Text>
                    )}
                </Group>
            </Box>

            {row.matchScore > 0 && (
                <Tooltip label={row.matchReason || 'LLM score'} multiline w={280}>
                    <Badge
                        color={scoreColor(row.matchScore)}
                        variant="light"
                        size="sm"
                        leftSection={<IconTargetArrow size={10} />}
                    >
                        {row.matchScore}
                    </Badge>
                </Tooltip>
            )}

            <Box onClick={(e) => e.stopPropagation()}>
                <StatusSelector
                    value={row.status}
                    onChange={(status) => onStatusChange(row.id, status)}
                    compact
                />
            </Box>

            <Box
                className="app-row-actions"
                onClick={(e) => e.stopPropagation()}
                style={{ display: 'flex', gap: 4 }}
            >
                {row.jobUrl && (
                    <Tooltip label={t('applications.openLink')}>
                        <ActionIcon
                            variant="subtle"
                            size="sm"
                            onClick={() => window.api.shell.openExternal(row.jobUrl)}
                        >
                            <IconExternalLink size={14} />
                        </ActionIcon>
                    </Tooltip>
                )}
                <Menu position="bottom-end" withArrow>
                    <Menu.Target>
                        <ActionIcon variant="subtle" size="sm">
                            <IconDotsVertical size={14} />
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
                                            name: row.companyName,
                                        }),
                                    )
                                )
                                    onDelete(row.id);
                            }}
                        >
                            {t('common.delete')}
                        </Menu.Item>
                    </Menu.Dropdown>
                </Menu>
            </Box>
        </Box>
    );
}
