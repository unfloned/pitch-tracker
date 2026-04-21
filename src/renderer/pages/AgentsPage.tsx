import { Box, Button, Center, Group, Loader, Stack, Text, Title } from '@mantine/core';
import { IconHistory, IconPlus, IconRobot, IconSettings } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { SerializedJobSearch } from '@shared/job-search';
import { SearchRow } from '../components/agents/SearchRow';
import { SearchFormDrawer } from '../components/agents/SearchFormDrawer';
import { AgentProfileDrawer } from '../components/agents/AgentProfileDrawer';
import { AgentRunLogDrawer } from '../components/agents/AgentRunLogDrawer';

export function AgentsPage() {
    const { t } = useTranslation();
    const [searches, setSearches] = useState<SerializedJobSearch[]>([]);
    const [runningIds, setRunningIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [formOpen, setFormOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [logOpen, setLogOpen] = useState(false);
    const [editing, setEditing] = useState<SerializedJobSearch | null>(null);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const s = await window.api.agents.listSearches();
            setSearches(s);
            const running = await window.api.agents.runningSearches();
            setRunningIds(new Set(running));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
        const offStart = window.api.on('agents:runStarted', (p: { searchId: string }) => {
            setRunningIds((prev) => new Set(prev).add(p.searchId));
        });
        const offFinished = window.api.on('agents:runFinished', (p: { searchId: string }) => {
            setRunningIds((prev) => {
                const next = new Set(prev);
                next.delete(p.searchId);
                return next;
            });
            refresh();
        });
        return () => {
            offStart();
            offFinished();
        };
    }, [refresh]);

    const runSearch = async (id: string) => {
        try {
            await window.api.agents.runSearch(id);
        } catch (err) {
            notifications.show({
                color: 'red',
                title: t('notifications.agentRunFailed'),
                message: (err as Error).message,
            });
        }
    };

    const cancelRun = async (id: string) => {
        await window.api.agents.cancelRun(id);
    };

    const grouped = useMemo(() => {
        const active: SerializedJobSearch[] = [];
        const paused: SerializedJobSearch[] = [];
        for (const s of searches) {
            if (s.enabled) active.push(s);
            else paused.push(s);
        }
        return { active, paused };
    }, [searches]);

    if (loading) {
        return (
            <Center mih={400}>
                <Loader />
            </Center>
        );
    }

    if (searches.length === 0) {
        return (
            <Center mih={400}>
                <Stack align="center" gap="md" maw={380}>
                    <IconRobot size={48} style={{ opacity: 0.3 }} />
                    <Stack align="center" gap={4}>
                        <Title order={4}>{t('candidates.noSearchesTitle')}</Title>
                        <Text c="dimmed" ta="center" size="sm">
                            {t('candidates.noSearchesSubtitle')}
                        </Text>
                    </Stack>
                    <Button
                        leftSection={<IconPlus size={16} />}
                        onClick={() => {
                            setEditing(null);
                            setFormOpen(true);
                        }}
                    >
                        {t('candidates.newSearch')}
                    </Button>
                </Stack>

                <SearchFormDrawer
                    opened={formOpen}
                    onClose={() => setFormOpen(false)}
                    initial={editing}
                    onSaved={async () => {
                        setFormOpen(false);
                        await refresh();
                    }}
                />
            </Center>
        );
    }

    return (
        <Stack gap="md">
            <Group justify="space-between" align="end" wrap="wrap">
                <Stack gap={2}>
                    <Title order={2}>{t('nav.agents')}</Title>
                    <Text c="dimmed" size="sm">
                        {searches.length} {searches.length === 1 ? 'agent' : 'agents'}
                    </Text>
                </Stack>
                <Group gap="xs">
                    <Button
                        variant="subtle"
                        size="xs"
                        leftSection={<IconHistory size={14} />}
                        onClick={() => setLogOpen(true)}
                    >
                        {t('candidates.runLog')}
                    </Button>
                    <Button
                        variant="subtle"
                        size="xs"
                        leftSection={<IconSettings size={14} />}
                        onClick={() => setProfileOpen(true)}
                    >
                        {t('candidates.profile')}
                    </Button>
                    <Button
                        size="xs"
                        leftSection={<IconPlus size={14} />}
                        onClick={() => {
                            setEditing(null);
                            setFormOpen(true);
                        }}
                    >
                        {t('candidates.newSearch')}
                    </Button>
                </Group>
            </Group>

            <Stack gap="lg">
                {[
                    { key: 'active', items: grouped.active, label: t('applications.groupActive') },
                    { key: 'paused', items: grouped.paused, label: t('applications.groupDraft') },
                ].map((group) => {
                    if (group.items.length === 0) return null;
                    return (
                        <Box key={group.key}>
                            <Group gap={6} mb="xs">
                                <Text
                                    size="xs"
                                    fw={600}
                                    c="dimmed"
                                    tt="uppercase"
                                    style={{ letterSpacing: '0.05em' }}
                                >
                                    {group.label}
                                </Text>
                                <Text size="xs" c="dimmed">
                                    · {group.items.length}
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
                                {group.items.map((s) => (
                                    <SearchRow
                                        key={s.id}
                                        search={s}
                                        isRunning={runningIds.has(s.id)}
                                        onEdit={() => {
                                            setEditing(s);
                                            setFormOpen(true);
                                        }}
                                        onDelete={async () => {
                                            await window.api.agents.deleteSearch(s.id);
                                            await refresh();
                                        }}
                                        onRun={() => runSearch(s.id)}
                                        onCancel={() => cancelRun(s.id)}
                                        onToggleEnabled={async (enabled) => {
                                            await window.api.agents.updateSearch(s.id, { enabled });
                                            await refresh();
                                        }}
                                    />
                                ))}
                            </Stack>
                        </Box>
                    );
                })}
            </Stack>

            <SearchFormDrawer
                opened={formOpen}
                onClose={() => setFormOpen(false)}
                initial={editing}
                onSaved={async () => {
                    setFormOpen(false);
                    await refresh();
                }}
            />
            <AgentProfileDrawer opened={profileOpen} onClose={() => setProfileOpen(false)} />
            <AgentRunLogDrawer opened={logOpen} onClose={() => setLogOpen(false)} />
        </Stack>
    );
}
