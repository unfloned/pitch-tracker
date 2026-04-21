import { AppShell, Group, Tabs, Title } from '@mantine/core';
import { IconBriefcase, IconSparkles } from '@tabler/icons-react';
import { useCallback, useEffect, useState } from 'react';
import type { ApplicationRecord } from '../preload/index';
import { Toolbar } from './components/Toolbar';
import { ApplicationList } from './components/ApplicationList';
import { ApplicationFormModal } from './components/ApplicationForm';
import { SettingsModal } from './components/SettingsModal';
import { UpdateBanner } from './components/UpdateBanner';
import { JobSearchesPage } from './pages/JobSearchesPage';

type TabValue = 'applications' | 'candidates';

export function App() {
    const [rows, setRows] = useState<ApplicationRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<ApplicationRecord | null>(null);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [tab, setTab] = useState<TabValue>('applications');

    const refresh = useCallback(async () => {
        setLoading(true);
        const data = await window.api.applications.list();
        setRows(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        refresh();
        const unsubscribe = window.api.on('navigate', (target: string) => {
            if (target === 'new') {
                setTab('applications');
                setEditing(null);
                setFormOpen(true);
            }
        });
        return unsubscribe;
    }, [refresh]);

    const openNew = () => {
        setEditing(null);
        setFormOpen(true);
    };

    const openEdit = (row: ApplicationRecord) => {
        setEditing(row);
        setFormOpen(true);
    };

    return (
        <AppShell header={{ height: 56 }} padding="md">
            <AppShell.Header style={{ WebkitAppRegion: 'drag' } as any}>
                <Group h="100%" px="md" justify="space-between" pl={80}>
                    <Title order={4}>Simple Application Tracker</Title>
                    <div style={{ WebkitAppRegion: 'no-drag' } as any}>
                        <Toolbar
                            onNew={openNew}
                            onSettings={() => setSettingsOpen(true)}
                            onExport={async () => {
                                const result = await window.api.export.excel();
                                if (!result.canceled && result.filePath) {
                                    console.log(`Exportiert: ${result.count} → ${result.filePath}`);
                                }
                            }}
                        />
                    </div>
                </Group>
            </AppShell.Header>

            <AppShell.Main>
                <UpdateBanner />
                <Tabs
                    value={tab}
                    onChange={(v) => v && setTab(v as TabValue)}
                    mb="md"
                    variant="pills"
                    radius="md"
                >
                    <Tabs.List>
                        <Tabs.Tab value="applications" leftSection={<IconBriefcase size={16} />}>
                            Bewerbungen ({rows.length})
                        </Tabs.Tab>
                        <Tabs.Tab value="candidates" leftSection={<IconSparkles size={16} />}>
                            Vorschläge
                        </Tabs.Tab>
                    </Tabs.List>
                </Tabs>

                {tab === 'applications' && (
                    <ApplicationList
                        rows={rows}
                        loading={loading}
                        onEdit={openEdit}
                        onDelete={async (id) => {
                            await window.api.applications.delete(id);
                            await refresh();
                        }}
                        onStatusChange={async (id, status) => {
                            await window.api.applications.update(id, { status });
                            await refresh();
                        }}
                    />
                )}

                {tab === 'candidates' && (
                    <JobSearchesPage
                        onCandidateImported={async () => {
                            await refresh();
                            setTab('applications');
                        }}
                    />
                )}
            </AppShell.Main>

            <ApplicationFormModal
                opened={formOpen}
                onClose={() => setFormOpen(false)}
                initial={editing}
                onSaved={async () => {
                    setFormOpen(false);
                    await refresh();
                }}
                onDelete={async (id) => {
                    await window.api.applications.delete(id);
                    await refresh();
                }}
            />

            <SettingsModal opened={settingsOpen} onClose={() => setSettingsOpen(false)} />
        </AppShell>
    );
}
