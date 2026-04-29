import { Center, Loader, Stack, Text } from '@mantine/core';
import { IconHistory, IconPlus, IconRobot, IconSettings } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { SerializedJobSearch } from '@shared/job-search';
import { SearchRow } from '../components/agents/SearchRow';
import { SearchFormDrawer } from '../components/agents/SearchFormDrawer';
import { AgentProfileDrawer } from '../components/agents/AgentProfileDrawer';
import { AgentRunLogDrawer } from '../components/agents/AgentRunLogDrawer';
import { GhostBtn } from '../components/primitives/GhostBtn';
import { Label } from '../components/primitives/Label';

export function AgentsPage() {
    const { t } = useTranslation();
    const [searches, setSearches] = useState<SerializedJobSearch[]>([]);
    const [runningIds, setRunningIds] = useState<Set<string>>(new Set());
    const [stoppingIds, setStoppingIds] = useState<Set<string>>(new Set());
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
            // Clear the stopping flag too - the run has actually ended,
            // whether via normal completion or user cancel.
            setStoppingIds((prev) => {
                if (!prev.has(p.searchId)) return prev;
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
        // Optimistically flip into "stopping" so the UI gives feedback even
        // though the abort takes effect only between listings - the in-flight
        // Ollama call still has to finish before the loop checks the signal.
        setStoppingIds((prev) => new Set(prev).add(id));
        try {
            await window.api.agents.cancelRun(id);
        } catch {
            // If the IPC fails, drop the optimistic flag so the user can retry.
            setStoppingIds((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
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

    if (loading && searches.length === 0) {
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
                    <IconRobot size={48} style={{ opacity: 0.3, color: 'var(--ink-4)' }} />
                    <Stack align="center" gap={4}>
                        <Text size="lg" fw={500} className="serif" style={{ color: 'var(--ink)' }}>
                            {t('candidates.noSearchesTitle')}
                        </Text>
                        <Text size="sm" ta="center" style={{ color: 'var(--ink-3)' }}>
                            {t('candidates.noSearchesSubtitle')}
                        </Text>
                    </Stack>
                    <GhostBtn
                        active
                        onClick={() => {
                            setEditing(null);
                            setFormOpen(true);
                        }}
                        style={{
                            background: 'var(--ink)',
                            color: 'var(--paper)',
                            borderColor: 'var(--ink)',
                        }}
                    >
                        <IconPlus size={12} />
                        <span>{t('candidates.newSearch')}</span>
                    </GhostBtn>
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
        <>
            {/* header */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    marginBottom: 18,
                }}
            >
                <span
                    className="serif"
                    style={{
                        fontSize: 22,
                        fontWeight: 500,
                        color: 'var(--ink)',
                        letterSpacing: '-0.015em',
                    }}
                >
                    {t('nav.agents')}
                </span>
                <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                    {searches.length} defined · {grouped.active.length} active
                </span>
                <div style={{ flex: 1 }} />
                <GhostBtn onClick={() => setLogOpen(true)}>
                    <IconHistory size={12} />
                    <span>{t('candidates.runLog')}</span>
                </GhostBtn>
                <GhostBtn onClick={() => setProfileOpen(true)}>
                    <IconSettings size={12} />
                    <span>{t('candidates.profile')}</span>
                </GhostBtn>
                <GhostBtn
                    active
                    onClick={() => {
                        setEditing(null);
                        setFormOpen(true);
                    }}
                    style={{
                        background: 'var(--ink)',
                        color: 'var(--paper)',
                        borderColor: 'var(--ink)',
                    }}
                >
                    <IconPlus size={12} />
                    <span>{t('candidates.newSearch')}</span>
                </GhostBtn>
            </div>

            {/* groups */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                {[
                    { key: 'active', items: grouped.active, label: t('applications.groupActive') },
                    { key: 'paused', items: grouped.paused, label: t('applications.groupDraft') },
                ].map((group) => {
                    if (group.items.length === 0) return null;
                    return (
                        <div key={group.key}>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    marginBottom: 8,
                                }}
                            >
                                <Label>
                                    {group.label} · {group.items.length}
                                </Label>
                                <div style={{ flex: 1, height: 1, background: 'var(--rule)' }} />
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 10,
                                }}
                            >
                                {group.items.map((s) => (
                                    <SearchRow
                                        key={s.id}
                                        search={s}
                                        isRunning={runningIds.has(s.id)}
                                        isStopping={stoppingIds.has(s.id)}
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
                            </div>
                        </div>
                    );
                })}
            </div>

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
        </>
    );
}
