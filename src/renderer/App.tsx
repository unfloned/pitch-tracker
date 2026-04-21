import { AppShell, Group, Tabs, Title, Box } from '@mantine/core';
import { IconBriefcase, IconSparkles } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useCallback, useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { STATUS_ORDER } from '@shared/application';
import type { ApplicationRecord } from '../preload/index';
import { Toolbar } from './components/Toolbar';
import { ApplicationList } from './components/ApplicationList';
import { ApplicationFormModal } from './components/ApplicationForm';
import { SettingsModal } from './components/SettingsModal';
import { UpdateBanner } from './components/UpdateBanner';
import { StatusFooter } from './components/StatusFooter';
import { JobSearchesPage } from './pages/JobSearchesPage';

type TabValue = 'applications' | 'candidates';

export function App() {
    const { t } = useTranslation();
    const [rows, setRows] = useState<ApplicationRecord[]>([]);
    const [visibleCount, setVisibleCount] = useState(0);
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
        const unsubNav = window.api.on('navigate', (target: string) => {
            if (target === 'new') {
                setTab('applications');
                setEditing(null);
                setFormOpen(true);
            }
        });
        const unsubAutoImport = window.api.on(
            'agents:autoImported',
            (payload: { candidate: string; score: number }) => {
                notifications.show({
                    color: 'teal',
                    title: t('notifications.autoImportedTitle', { score: payload.score }),
                    message: payload.candidate,
                });
                refresh();
            },
        );
        const unsubFinished = window.api.on(
            'agents:runFinished',
            (payload: { scanned: number; added: number; canceled: boolean; errors: string[] }) => {
                if (payload.canceled) {
                    notifications.show({ color: 'gray', message: t('notifications.agentRunCanceled') });
                    return;
                }
                const stats = t('notifications.agentRunFinishedStats', {
                    scanned: payload.scanned,
                    added: payload.added,
                });
                notifications.show({
                    color: payload.added > 0 ? 'green' : 'gray',
                    title: t('notifications.agentRunFinishedTitle'),
                    message:
                        payload.errors.length > 0
                            ? t('notifications.agentRunFinishedWithErrors', {
                                  stats,
                                  errors: payload.errors.join('; '),
                              })
                            : stats,
                    autoClose: 6000,
                });
            },
        );
        return () => {
            unsubNav();
            unsubAutoImport();
            unsubFinished();
        };
    }, [refresh, t]);

    const openNew = () => {
        setEditing(null);
        setFormOpen(true);
    };

    const openEdit = (row: ApplicationRecord) => {
        setEditing(row);
        setFormOpen(true);
    };

    const tabsSection = useMemo(
        () => (
            <Tabs
                value={tab}
                onChange={(v) => v && setTab(v as TabValue)}
                variant="pills"
                radius="md"
                styles={{ root: { width: '100%' } }}
            >
                <Tabs.List>
                    <Tabs.Tab value="applications" leftSection={<IconBriefcase size={16} />}>
                        {t('tabs.applications')} ({rows.length})
                    </Tabs.Tab>
                    <Tabs.Tab value="candidates" leftSection={<IconSparkles size={16} />}>
                        {t('tabs.candidates')}
                    </Tabs.Tab>
                </Tabs.List>
            </Tabs>
        ),
        [tab, rows.length, t],
    );

    return (
        <AppShell header={{ height: 110 }} footer={{ height: 52 }} padding="md">
            <AppShell.Header>
                <div style={{ WebkitAppRegion: 'drag' } as any}>
                    <Group h={56} px="md" justify="space-between" pl={80}>
                        <Title order={4}>{t('app.title')}</Title>
                        <div style={{ WebkitAppRegion: 'no-drag' } as any}>
                            <Toolbar
                                onNew={openNew}
                                onSettings={() => setSettingsOpen(true)}
                                onExport={async () => {
                                    const labels = {
                                        sheetName: t('excel.sheetName'),
                                        status: Object.fromEntries(
                                            STATUS_ORDER.map((s) => [s, t(`status.${s}`)]),
                                        ),
                                        remote: {
                                            onsite: t('remote.onsite'),
                                            hybrid: t('remote.hybrid'),
                                            remote: t('remote.remote'),
                                        },
                                        priority: {
                                            low: t('priority.low'),
                                            medium: t('priority.medium'),
                                            high: t('priority.high'),
                                        },
                                        headers: {
                                            status: t('excel.headers.status'),
                                            match: t('excel.headers.match'),
                                            company: t('excel.headers.company'),
                                            jobTitle: t('excel.headers.jobTitle'),
                                            location: t('excel.headers.location'),
                                            remote: t('excel.headers.remote'),
                                            stack: t('excel.headers.stack'),
                                            salaryMin: t('excel.headers.salaryMin'),
                                            salaryMax: t('excel.headers.salaryMax'),
                                            currency: t('excel.headers.currency'),
                                            priority: t('excel.headers.priority'),
                                            contactName: t('excel.headers.contactName'),
                                            contactEmail: t('excel.headers.contactEmail'),
                                            contactPhone: t('excel.headers.contactPhone'),
                                            tags: t('excel.headers.tags'),
                                            appliedAt: t('excel.headers.appliedAt'),
                                            source: t('excel.headers.source'),
                                            jobUrl: t('excel.headers.jobUrl'),
                                            companyWebsite: t('excel.headers.companyWebsite'),
                                            requiredProfile: t('excel.headers.requiredProfile'),
                                            benefits: t('excel.headers.benefits'),
                                            matchReason: t('excel.headers.matchReason'),
                                            notes: t('excel.headers.notes'),
                                            createdAt: t('excel.headers.createdAt'),
                                            updatedAt: t('excel.headers.updatedAt'),
                                        },
                                    };
                                    const result = await window.api.export.excel(
                                        labels,
                                        t('excel.dialogTitle'),
                                    );
                                    if (!result.canceled && result.filePath) {
                                        notifications.show({
                                            color: 'green',
                                            message: t('notifications.exported', {
                                                count: result.count,
                                            }),
                                        });
                                    }
                                }}
                            />
                        </div>
                    </Group>
                </div>
                <Box
                    px="md"
                    style={{
                        borderTop: '1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))',
                        WebkitAppRegion: 'no-drag',
                    } as any}
                >
                    <Group h={54} gap="md">
                        {tabsSection}
                    </Group>
                </Box>
            </AppShell.Header>

            <AppShell.Main>
                <UpdateBanner />
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
                        onVisibleCountChange={setVisibleCount}
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

            <AppShell.Footer>
                <StatusFooter
                    totalApplications={rows.length}
                    visibleApplications={
                        tab === 'applications' && visibleCount > 0 ? visibleCount : rows.length
                    }
                />
            </AppShell.Footer>

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
