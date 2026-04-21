import { AppShell, Badge, Box, Group, Tabs, Title } from '@mantine/core';
import { useHotkeys } from '@mantine/hooks';
import { IconBriefcase, IconSparkles } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { STATUS_ORDER } from '@shared/application';
import type { ApplicationRecord } from '../preload/index';
import { Toolbar } from './components/Toolbar';
import { ApplicationList } from './components/ApplicationList';
import { ApplicationFormModal } from './components/ApplicationForm';
import { SettingsModal } from './components/SettingsModal';
import { UpdateBanner } from './components/UpdateBanner';
import { StatusFooter } from './components/StatusFooter';
import { OnboardingWizard } from './components/OnboardingWizard';
import { JobSearchesPage } from './pages/JobSearchesPage';

type TabValue = 'applications' | 'candidates';

const ONBOARDING_KEY = 'simple-tracker-onboarded';

export function App() {
    const { t } = useTranslation();
    const [rows, setRows] = useState<ApplicationRecord[]>([]);
    const [visibleCount, setVisibleCount] = useState(0);
    const [newCandidatesCount, setNewCandidatesCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<ApplicationRecord | null>(null);
    const [quickAddUrl, setQuickAddUrl] = useState<string | null>(null);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [onboardingOpen, setOnboardingOpen] = useState(false);
    const [tab, setTab] = useState<TabValue>('applications');
    const searchInputRef = useRef<HTMLInputElement | null>(null);

    const refresh = useCallback(async () => {
        setLoading(true);
        const data = await window.api.applications.list();
        setRows(data);
        setLoading(false);
    }, []);

    const refreshCandidateCount = useCallback(async () => {
        try {
            const cands = await window.api.agents.listCandidates(0);
            const count = cands.filter((c) => c.status === 'new').length;
            setNewCandidatesCount(count);
        } catch {
            setNewCandidatesCount(0);
        }
    }, []);

    useEffect(() => {
        refresh();
        refreshCandidateCount();

        if (!localStorage.getItem(ONBOARDING_KEY)) {
            const hasData = window.api.applications.list().then((list) => {
                if (list.length === 0) {
                    setOnboardingOpen(true);
                }
            });
            void hasData;
        }

        const unsubNav = window.api.on('navigate', (target: string) => {
            if (target === 'new') {
                setTab('applications');
                setEditing(null);
                setQuickAddUrl(null);
                setFormOpen(true);
            }
        });
        const unsubQuickAdd = window.api.on(
            'navigate:quickAdd',
            (payload: { url: string }) => {
                setTab('applications');
                setEditing(null);
                setQuickAddUrl(payload.url || '');
                setFormOpen(true);
            },
        );
        const unsubOpenApplication = window.api.on(
            'navigate:openApplication',
            async (id: string) => {
                setTab('applications');
                const found = await window.api.applications.get(id);
                if (found) {
                    setEditing(found);
                    setFormOpen(true);
                }
            },
        );
        const unsubAutoImport = window.api.on(
            'agents:autoImported',
            (payload: { candidate: string; score: number }) => {
                notifications.show({
                    color: 'teal',
                    title: t('notifications.autoImportedTitle', { score: payload.score }),
                    message: payload.candidate,
                });
                refresh();
                refreshCandidateCount();
            },
        );
        const unsubCandidateAdded = window.api.on('agents:candidateAdded', () => {
            refreshCandidateCount();
        });
        const unsubFinished = window.api.on(
            'agents:runFinished',
            (payload: { scanned: number; added: number; canceled: boolean; errors: string[] }) => {
                refreshCandidateCount();
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
        const unsubFollowUp = window.api.on(
            'reminders:followUp',
            (payload: { applicationId: string; companyName: string; daysSinceApplied: number }) => {
                notifications.show({
                    color: 'yellow',
                    title: t('notifications.followUpTitle', { days: payload.daysSinceApplied }),
                    message: payload.companyName,
                    autoClose: 10000,
                });
            },
        );
        return () => {
            unsubNav();
            unsubQuickAdd();
            unsubOpenApplication();
            unsubAutoImport();
            unsubCandidateAdded();
            unsubFinished();
            unsubFollowUp();
        };
    }, [refresh, refreshCandidateCount, t]);

    const openNew = () => {
        setEditing(null);
        setQuickAddUrl(null);
        setFormOpen(true);
    };

    const openEdit = (row: ApplicationRecord) => {
        setEditing(row);
        setQuickAddUrl(null);
        setFormOpen(true);
    };

    const doExport = async () => {
        const labels = {
            sheetName: t('excel.sheetName'),
            status: Object.fromEntries(STATUS_ORDER.map((s) => [s, t(`status.${s}`)])),
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
        const result = await window.api.export.excel(labels, t('excel.dialogTitle'));
        if (!result.canceled && result.filePath) {
            notifications.show({
                color: 'green',
                message: t('notifications.exported', { count: result.count }),
            });
        }
    };

    useHotkeys([
        ['mod+n', () => openNew()],
        ['mod+f', () => searchInputRef.current?.focus()],
        ['mod+e', () => doExport()],
        ['mod+,', () => setSettingsOpen(true)],
        ['escape', () => {
            if (formOpen) setFormOpen(false);
            else if (settingsOpen) setSettingsOpen(false);
        }],
    ]);

    const tabsSection = useMemo(
        () => (
            <Tabs
                value={tab}
                onChange={(v) => {
                    if (v) {
                        setTab(v as TabValue);
                        if (v === 'candidates') {
                            setNewCandidatesCount(0);
                        }
                    }
                }}
                variant="pills"
                radius="md"
                styles={{ root: { width: '100%' } }}
            >
                <Tabs.List>
                    <Tabs.Tab value="applications" leftSection={<IconBriefcase size={16} />}>
                        {t('tabs.applications')} ({rows.length})
                    </Tabs.Tab>
                    <Tabs.Tab
                        value="candidates"
                        leftSection={<IconSparkles size={16} />}
                        rightSection={
                            newCandidatesCount > 0 ? (
                                <Badge size="xs" color="red" variant="filled" circle>
                                    {newCandidatesCount}
                                </Badge>
                            ) : null
                        }
                    >
                        {t('tabs.candidates')}
                    </Tabs.Tab>
                </Tabs.List>
            </Tabs>
        ),
        [tab, rows.length, newCandidatesCount, t],
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
                                onExport={doExport}
                            />
                        </div>
                    </Group>
                </div>
                <Box
                    px="md"
                    style={{
                        borderTop:
                            '1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))',
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
                        onNew={openNew}
                        searchInputRef={searchInputRef}
                    />
                )}

                {tab === 'candidates' && (
                    <JobSearchesPage
                        onCandidateImported={async () => {
                            await refresh();
                            await refreshCandidateCount();
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
                onClose={() => {
                    setFormOpen(false);
                    setQuickAddUrl(null);
                }}
                initial={editing}
                initialUrl={quickAddUrl}
                onSaved={async () => {
                    setFormOpen(false);
                    setQuickAddUrl(null);
                    await refresh();
                }}
                onDelete={async (id) => {
                    await window.api.applications.delete(id);
                    await refresh();
                }}
            />

            <SettingsModal opened={settingsOpen} onClose={() => setSettingsOpen(false)} />

            <OnboardingWizard
                opened={onboardingOpen}
                onClose={() => {
                    localStorage.setItem(ONBOARDING_KEY, '1');
                    setOnboardingOpen(false);
                }}
            />
        </AppShell>
    );
}
