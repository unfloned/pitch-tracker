import { Badge, Box, Group, ScrollArea, Stack, Text } from '@mantine/core';
import { IconTargetArrow } from '@tabler/icons-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ApplicationRecord } from '../../preload/index';
import type { ApplicationStatus } from '@shared/application';
import { STATUS_ORDER } from '@shared/application';

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

const VISIBLE_STATUSES: ApplicationStatus[] = [
    'draft',
    'applied',
    'in_review',
    'interview_scheduled',
    'interviewed',
    'offer_received',
    'accepted',
    'rejected',
];

function scoreColor(score: number): string {
    if (score >= 90) return 'teal';
    if (score >= 70) return 'green';
    if (score >= 50) return 'yellow';
    if (score > 0) return 'orange';
    return 'gray';
}

interface Props {
    rows: ApplicationRecord[];
    onEdit: (row: ApplicationRecord) => void;
    onStatusChange: (id: string, status: ApplicationStatus) => void;
}

export function ApplicationBoard({ rows, onEdit, onStatusChange }: Props) {
    const { t } = useTranslation();

    const grouped = useMemo(() => {
        const map = new Map<ApplicationStatus, ApplicationRecord[]>();
        for (const s of VISIBLE_STATUSES) map.set(s, []);
        for (const r of rows) {
            if (r.status === 'withdrawn') continue;
            map.get(r.status)?.push(r);
        }
        return map;
    }, [rows]);

    return (
        <ScrollArea.Autosize mah="calc(100vh - 280px)" type="auto">
            <Group gap="sm" align="stretch" wrap="nowrap">
                {VISIBLE_STATUSES.map((status) => {
                    const items = grouped.get(status) ?? [];
                    const color = STATUS_COLOR[status];
                    return (
                        <Stack
                            key={status}
                            gap="xs"
                            p="sm"
                            miw={260}
                            style={{
                                width: 260,
                                flexShrink: 0,
                                borderRadius: 10,
                                backgroundColor:
                                    'light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-7))',
                            }}
                        >
                            <Group justify="space-between" wrap="nowrap">
                                <Group gap={6} wrap="nowrap">
                                    <Box
                                        w={8}
                                        h={8}
                                        style={{
                                            borderRadius: '50%',
                                            backgroundColor: `var(--mantine-color-${color}-5)`,
                                        }}
                                    />
                                    <Text size="xs" fw={600} tt="uppercase">
                                        {t(`status.${status}`)}
                                    </Text>
                                </Group>
                                <Badge size="xs" variant="light" color="gray">
                                    {items.length}
                                </Badge>
                            </Group>
                            <Stack gap={6}>
                                {items.length === 0 && (
                                    <Text size="xs" c="dimmed" ta="center" py="md">
                                        -
                                    </Text>
                                )}
                                {items.map((r) => (
                                    <Box
                                        key={r.id}
                                        onClick={() => onEdit(r)}
                                        style={{
                                            padding: 10,
                                            borderRadius: 8,
                                            backgroundColor:
                                                'light-dark(white, var(--mantine-color-dark-6))',
                                            border:
                                                '1px solid light-dark(var(--mantine-color-gray-2), var(--mantine-color-dark-5))',
                                            cursor: 'pointer',
                                            transition: 'transform 120ms, border-color 120ms',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = `var(--mantine-color-${color}-4)`;
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor =
                                                'light-dark(var(--mantine-color-gray-2), var(--mantine-color-dark-5))';
                                        }}
                                    >
                                        <Text size="sm" fw={600} lineClamp={1}>
                                            {r.companyName || '-'}
                                        </Text>
                                        <Text size="xs" c="dimmed" lineClamp={1} mb={6}>
                                            {r.jobTitle || '-'}
                                        </Text>
                                        <Group gap={6} wrap="nowrap">
                                            {r.location && (
                                                <Text size="xs" c="dimmed" lineClamp={1}>
                                                    {r.location}
                                                </Text>
                                            )}
                                            {r.matchScore > 0 && (
                                                <Badge
                                                    color={scoreColor(r.matchScore)}
                                                    variant="light"
                                                    size="xs"
                                                    leftSection={<IconTargetArrow size={9} />}
                                                    ml="auto"
                                                >
                                                    {r.matchScore}
                                                </Badge>
                                            )}
                                        </Group>
                                    </Box>
                                ))}
                            </Stack>
                        </Stack>
                    );
                })}
            </Group>
        </ScrollArea.Autosize>
    );
}
