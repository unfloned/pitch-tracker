import { Badge, Box, Card, Center, Drawer, Group, Loader, ScrollArea, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AgentRunRecord } from '@shared/job-search';

interface Props {
    opened: boolean;
    onClose: () => void;
}

export function AgentRunLogDrawer({ opened, onClose }: Props) {
    const { t } = useTranslation();
    const [runs, setRuns] = useState<AgentRunRecord[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!opened) return;
        setLoading(true);
        window.api.agents
            .listRuns(50)
            .then((r) => setRuns(r))
            .catch((err) => {
                notifications.show({
                    color: 'red',
                    title: t('notifications.loadFailed'),
                    message: (err as Error).message,
                });
            })
            .finally(() => setLoading(false));
    }, [opened, t]);

    return (
        <Drawer
            opened={opened}
            onClose={onClose}
            position="right"
            size="lg"
            title={t('runLog.title')}
            scrollAreaComponent={ScrollArea.Autosize}
        >
            {loading ? (
                <Center py="xl">
                    <Loader />
                </Center>
            ) : runs.length === 0 ? (
                <Center py="xl">
                    <Text c="dimmed">{t('runLog.empty')}</Text>
                </Center>
            ) : (
                <Stack gap="sm">
                    {runs.map((r) => (
                        <Card key={r.id} withBorder padding="sm">
                            <Group justify="space-between" mb={4}>
                                <Text fw={600} size="sm">
                                    {r.searchLabel}
                                </Text>
                                <Group gap={4}>
                                    {r.canceled && (
                                        <Badge color="gray" size="xs">
                                            {t('runLog.canceled')}
                                        </Badge>
                                    )}
                                    {r.error && !r.canceled && (
                                        <Badge color="red" size="xs">
                                            {t('runLog.errors')}
                                        </Badge>
                                    )}
                                    {!r.canceled && !r.error && r.finishedAt && (
                                        <Badge color="green" size="xs">
                                            {t('runLog.ok')}
                                        </Badge>
                                    )}
                                </Group>
                            </Group>
                            <Text size="xs" c="dimmed">
                                {new Date(r.startedAt).toLocaleString()} · {t('runLog.sources')}:{' '}
                                {r.sources.join(', ')}
                            </Text>
                            <Text size="xs" c="dimmed">
                                {t('runLog.stats', { scanned: r.scanned, added: r.added })}
                            </Text>
                            {r.error && (
                                <Box mt={4}>
                                    <Text size="xs" c="red">
                                        {r.error}
                                    </Text>
                                </Box>
                            )}
                        </Card>
                    ))}
                </Stack>
            )}
        </Drawer>
    );
}
