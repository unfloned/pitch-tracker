import {
    ActionIcon,
    Badge,
    Box,
    Button,
    Code,
    Group,
    Menu,
    Stack,
    Switch,
    Text,
    Tooltip,
} from '@mantine/core';
import {
    IconCalendar,
    IconClock,
    IconDotsVertical,
    IconPlayerPlay,
    IconPlayerStop,
    IconRobot,
    IconTrash,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { SerializedJobSearch } from '@shared/job-search';

function timeAgo(iso: string): string {
    const diffMs = Date.now() - new Date(iso).getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    return new Date(iso).toLocaleDateString();
}

function timeUntil(iso: string | null, manualLabel: string): string {
    if (!iso) return manualLabel;
    const diffMs = new Date(iso).getTime() - Date.now();
    if (diffMs <= 0) return 'now';
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ${minutes % 60}m`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
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

    return (
        <Box
            onClick={onEdit}
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
                    backgroundColor: search.enabled
                        ? 'var(--mantine-color-accent-1)'
                        : 'light-dark(var(--mantine-color-gray-2), var(--mantine-color-dark-5))',
                    color: search.enabled
                        ? 'var(--mantine-color-accent-7)'
                        : 'light-dark(var(--mantine-color-gray-6), var(--mantine-color-gray-5))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}
            >
                <IconRobot size={16} />
            </Box>

            <Box style={{ flex: 1, minWidth: 0 }}>
                <Group gap={6} wrap="nowrap" align="baseline">
                    <Text size="sm" fw={600} lineClamp={1}>
                        {search.label}
                    </Text>
                    {isRunning && (
                        <Badge color="blue" variant="filled" size="xs">
                            {t('candidates.running')}
                        </Badge>
                    )}
                    <Text size="xs" c="dimmed" lineClamp={1}>
                        <Code style={{ fontSize: 11, padding: '1px 4px' }}>
                            {search.keywords || t('candidates.any')}
                        </Code>
                    </Text>
                </Group>
                <Group gap={10} mt={2} wrap="nowrap">
                    <Group gap={3} wrap="nowrap">
                        {search.sources.slice(0, 4).map((src) => (
                            <Badge
                                key={src}
                                size="xs"
                                variant="light"
                                color="gray"
                                styles={{ root: { textTransform: 'none', fontWeight: 500 } }}
                            >
                                {t(`source.${src}`).split(' (')[0]}
                            </Badge>
                        ))}
                        {search.sources.length > 4 && (
                            <Badge size="xs" variant="light" color="gray">
                                +{search.sources.length - 4}
                            </Badge>
                        )}
                    </Group>
                    <Group gap={3} wrap="nowrap">
                        <IconClock size={11} style={{ opacity: 0.5 }} />
                        <Text size="xs" c="dimmed">
                            {t(`interval.${search.interval}`)}
                        </Text>
                    </Group>
                    {search.enabled && search.interval !== 'manual' && (
                        <Group gap={3} wrap="nowrap">
                            <IconCalendar size={11} style={{ opacity: 0.5 }} />
                            <Text size="xs" c="dimmed">
                                {timeUntil(search.nextRunAt, t('interval.manual'))}
                            </Text>
                        </Group>
                    )}
                    {search.lastRunAt && (
                        <Text size="xs" c="dimmed">
                            · {timeAgo(search.lastRunAt)}
                        </Text>
                    )}
                </Group>
            </Box>

            <Box onClick={(e) => e.stopPropagation()}>
                <Switch
                    size="xs"
                    checked={search.enabled}
                    onChange={(e) => onToggleEnabled(e.currentTarget.checked)}
                />
            </Box>

            <Box onClick={(e) => e.stopPropagation()}>
                {isRunning ? (
                    <Button
                        size="xs"
                        variant="light"
                        color="red"
                        leftSection={<IconPlayerStop size={12} />}
                        onClick={onCancel}
                    >
                        {t('candidates.cancelRun')}
                    </Button>
                ) : (
                    <Button
                        size="xs"
                        variant="light"
                        leftSection={<IconPlayerPlay size={12} />}
                        onClick={onRun}
                    >
                        {t('candidates.runNow')}
                    </Button>
                )}
            </Box>

            <Box onClick={(e) => e.stopPropagation()}>
                <Menu position="bottom-end" withArrow>
                    <Menu.Target>
                        <ActionIcon variant="subtle" size="sm">
                            <IconDotsVertical size={14} />
                        </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                        <Menu.Item onClick={onEdit}>{t('common.edit')}</Menu.Item>
                        <Menu.Item
                            color="red"
                            leftSection={<IconTrash size={14} />}
                            onClick={() => {
                                if (confirm(t('confirm.deleteSearch', { label: search.label }))) {
                                    onDelete();
                                }
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
