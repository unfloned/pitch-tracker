import {
    ActionIcon,
    Anchor,
    Badge,
    Button,
    Card,
    Center,
    Checkbox,
    Code,
    Group,
    Loader,
    Menu,
    Modal,
    NumberInput,
    Select,
    SimpleGrid,
    Stack,
    Switch,
    Text,
    TextInput,
    Title,
    Tooltip,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
    IconArrowUpRight,
    IconDotsVertical,
    IconEye,
    IconEyeOff,
    IconPlayerPlay,
    IconPlus,
    IconSettings,
    IconTrash,
} from '@tabler/icons-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
    AgentProfile,
    ApplicationRecord,
} from '../../preload/index';
import type {
    JobSource,
    SerializedJobCandidate,
    SerializedJobSearch,
} from '@shared/job-search';
import { JOB_SOURCE_LABEL } from '@shared/job-search';

interface Props {
    onCandidateImported: (app: ApplicationRecord) => void;
}

function scoreColor(score: number): string {
    if (score >= 90) return 'teal';
    if (score >= 70) return 'green';
    if (score >= 50) return 'yellow';
    if (score > 0) return 'orange';
    return 'gray';
}

export function JobSearchesPage({ onCandidateImported }: Props) {
    const [searches, setSearches] = useState<SerializedJobSearch[]>([]);
    const [candidates, setCandidates] = useState<SerializedJobCandidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [runningId, setRunningId] = useState<string | null>(null);
    const [minScore, setMinScore] = useState(50);
    const [formOpen, setFormOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [editing, setEditing] = useState<SerializedJobSearch | null>(null);

    const refresh = useCallback(async () => {
        setLoading(true);
        const [s, c] = await Promise.all([
            window.api.agents.listSearches(),
            window.api.agents.listCandidates(0),
        ]);
        setSearches(s);
        setCandidates(c);
        setLoading(false);
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const runSearch = async (id: string) => {
        setRunningId(id);
        try {
            const result = await window.api.agents.runSearch(id);
            notifications.show({
                color: result.added > 0 ? 'green' : 'gray',
                message: `${result.scored} Stellen gescannt, ${result.added} neu.`,
            });
            await refresh();
        } catch (err) {
            notifications.show({
                color: 'red',
                title: 'Agent-Lauf fehlgeschlagen',
                message: (err as Error).message,
            });
        } finally {
            setRunningId(null);
        }
    };

    const filteredCandidates = useMemo(
        () => candidates.filter((c) => c.score >= minScore && c.status !== 'ignored'),
        [candidates, minScore],
    );

    return (
        <Stack gap="lg">
            <Group justify="space-between" align="end">
                <div>
                    <Title order={3}>Vorschläge</Title>
                    <Text size="sm" c="dimmed">
                        Agenten durchsuchen definierte Portale und scoren Stellen anhand deines Profils.
                    </Text>
                </div>
                <Group>
                    <Button
                        variant="subtle"
                        leftSection={<IconSettings size={16} />}
                        onClick={() => setProfileOpen(true)}
                    >
                        Profil
                    </Button>
                    <Button
                        leftSection={<IconPlus size={16} />}
                        onClick={() => {
                            setEditing(null);
                            setFormOpen(true);
                        }}
                    >
                        Neue Suche
                    </Button>
                </Group>
            </Group>

            <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="md">
                {searches.map((s) => (
                    <Card key={s.id} withBorder padding="md">
                        <Group justify="space-between" mb="xs">
                            <Text fw={600}>{s.label}</Text>
                            <Menu position="bottom-end">
                                <Menu.Target>
                                    <ActionIcon variant="subtle">
                                        <IconDotsVertical size={16} />
                                    </ActionIcon>
                                </Menu.Target>
                                <Menu.Dropdown>
                                    <Menu.Item
                                        onClick={() => {
                                            setEditing(s);
                                            setFormOpen(true);
                                        }}
                                    >
                                        Bearbeiten
                                    </Menu.Item>
                                    <Menu.Item
                                        color="red"
                                        leftSection={<IconTrash size={14} />}
                                        onClick={async () => {
                                            if (confirm(`Suche "${s.label}" löschen?`)) {
                                                await window.api.agents.deleteSearch(s.id);
                                                await refresh();
                                            }
                                        }}
                                    >
                                        Löschen
                                    </Menu.Item>
                                </Menu.Dropdown>
                            </Menu>
                        </Group>
                        <Stack gap={4} mb="sm">
                            <Text size="xs" c="dimmed">
                                Quelle: <b>{JOB_SOURCE_LABEL[s.source as JobSource]}</b>
                            </Text>
                            <Text size="xs" c="dimmed">
                                Keywords: <Code>{s.keywords || '—'}</Code>
                            </Text>
                            {s.lastRunAt && (
                                <Text size="xs" c="dimmed">
                                    Zuletzt: {new Date(s.lastRunAt).toLocaleString('de-DE')}
                                </Text>
                            )}
                        </Stack>
                        <Group>
                            <Switch
                                size="xs"
                                label="Aktiv"
                                checked={s.enabled}
                                onChange={async (e) => {
                                    await window.api.agents.updateSearch(s.id, {
                                        enabled: e.currentTarget.checked,
                                    });
                                    await refresh();
                                }}
                            />
                            <Button
                                size="xs"
                                variant="light"
                                leftSection={<IconPlayerPlay size={14} />}
                                loading={runningId === s.id}
                                onClick={() => runSearch(s.id)}
                                ml="auto"
                            >
                                Jetzt laufen
                            </Button>
                        </Group>
                    </Card>
                ))}
                {searches.length === 0 && !loading && (
                    <Card withBorder padding="lg">
                        <Center py="md">
                            <Stack align="center" gap={4}>
                                <Text c="dimmed">Keine Suchen angelegt.</Text>
                                <Text size="xs" c="dimmed">
                                    "Neue Suche" oben rechts klicken.
                                </Text>
                            </Stack>
                        </Center>
                    </Card>
                )}
            </SimpleGrid>

            <Group justify="space-between" align="end">
                <Title order={4}>Gefundene Stellen</Title>
                <NumberInput
                    label="Min. Passungs-Score"
                    value={minScore}
                    onChange={(v) => setMinScore(Number(v) || 0)}
                    min={0}
                    max={100}
                    w={180}
                />
            </Group>

            {loading ? (
                <Center py="md">
                    <Loader />
                </Center>
            ) : filteredCandidates.length === 0 ? (
                <Center py="xl">
                    <Stack align="center" gap={4}>
                        <Text c="dimmed">Keine Vorschläge.</Text>
                        <Text size="xs" c="dimmed">
                            Lass eine Suche laufen oder senke den Min-Score.
                        </Text>
                    </Stack>
                </Center>
            ) : (
                <Stack gap="sm">
                    {filteredCandidates.map((c) => (
                        <Card key={c.id} withBorder padding="sm">
                            <Group justify="space-between" wrap="nowrap" align="start">
                                <Stack gap={4} flex={1}>
                                    <Group gap="xs">
                                        <Badge color={scoreColor(c.score)} variant="filled">
                                            {c.score}
                                        </Badge>
                                        <Text fw={600}>{c.title}</Text>
                                        {c.company && (
                                            <Text size="sm" c="dimmed">
                                                · {c.company}
                                            </Text>
                                        )}
                                        {c.location && (
                                            <Text size="sm" c="dimmed">
                                                · {c.location}
                                            </Text>
                                        )}
                                    </Group>
                                    {c.scoreReason && (
                                        <Text size="xs" c="dimmed">
                                            {c.scoreReason}
                                        </Text>
                                    )}
                                    <Anchor
                                        size="xs"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            window.api.shell.openExternal(c.sourceUrl);
                                        }}
                                        href={c.sourceUrl}
                                    >
                                        <Group gap={4}>
                                            <IconArrowUpRight size={12} />
                                            {c.sourceUrl.replace(/^https?:\/\//, '').slice(0, 60)}
                                        </Group>
                                    </Anchor>
                                </Stack>
                                <Group gap="xs" wrap="nowrap">
                                    {c.status === 'imported' ? (
                                        <Badge variant="light">übernommen</Badge>
                                    ) : (
                                        <>
                                            <Tooltip label="Als Bewerbung anlegen">
                                                <ActionIcon
                                                    variant="light"
                                                    color="accent"
                                                    onClick={async () => {
                                                        const app = await window.api.agents.importCandidate(c.id);
                                                        onCandidateImported(app);
                                                        notifications.show({
                                                            color: 'green',
                                                            message: `${c.company || c.title} als Bewerbung angelegt.`,
                                                        });
                                                        await refresh();
                                                    }}
                                                >
                                                    <IconPlus size={16} />
                                                </ActionIcon>
                                            </Tooltip>
                                            <Tooltip label="Verwerfen">
                                                <ActionIcon
                                                    variant="subtle"
                                                    color="gray"
                                                    onClick={async () => {
                                                        await window.api.agents.updateCandidate(c.id, {
                                                            status: 'ignored',
                                                        });
                                                        await refresh();
                                                    }}
                                                >
                                                    <IconEyeOff size={16} />
                                                </ActionIcon>
                                            </Tooltip>
                                        </>
                                    )}
                                </Group>
                            </Group>
                        </Card>
                    ))}
                </Stack>
            )}

            <SearchFormModal
                opened={formOpen}
                onClose={() => setFormOpen(false)}
                initial={editing}
                onSaved={async () => {
                    setFormOpen(false);
                    await refresh();
                }}
            />

            <AgentProfileModal opened={profileOpen} onClose={() => setProfileOpen(false)} />
        </Stack>
    );
}

interface FormValuesSearch {
    label: string;
    keywords: string;
    source: JobSource;
    locationFilter: string;
    remoteOnly: boolean;
    minSalary: number;
    enabled: boolean;
}

function SearchFormModal({
    opened,
    onClose,
    initial,
    onSaved,
}: {
    opened: boolean;
    onClose: () => void;
    initial: SerializedJobSearch | null;
    onSaved: () => void;
}) {
    const form = useForm<FormValuesSearch>({
        initialValues: {
            label: '',
            keywords: '',
            source: 'germantechjobs',
            locationFilter: '',
            remoteOnly: true,
            minSalary: 0,
            enabled: true,
        },
    });

    useEffect(() => {
        if (!opened) return;
        if (initial) {
            form.setValues({
                label: initial.label,
                keywords: initial.keywords,
                source: initial.source as JobSource,
                locationFilter: initial.locationFilter,
                remoteOnly: initial.remoteOnly,
                minSalary: initial.minSalary,
                enabled: initial.enabled,
            });
        } else {
            form.setValues({
                label: 'TypeScript Remote',
                keywords: 'TypeScript',
                source: 'germantechjobs',
                locationFilter: '',
                remoteOnly: true,
                minSalary: 0,
                enabled: true,
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [opened, initial]);

    const submit = async (values: FormValuesSearch) => {
        if (initial) {
            await window.api.agents.updateSearch(initial.id, values);
        } else {
            await window.api.agents.createSearch(values);
        }
        onSaved();
    };

    return (
        <Modal opened={opened} onClose={onClose} title={initial ? 'Suche bearbeiten' : 'Neue Suche'}>
            <form onSubmit={form.onSubmit(submit)}>
                <Stack gap="md">
                    <TextInput label="Bezeichnung" required {...form.getInputProps('label')} />
                    <Select
                        label="Quelle"
                        data={[
                            { value: 'germantechjobs', label: 'GermanTechJobs' },
                            { value: 'join', label: 'Join.com' },
                            { value: 'url', label: 'Einzelne URL' },
                        ]}
                        {...form.getInputProps('source')}
                    />
                    <TextInput
                        label={form.values.source === 'url' ? 'Job-URL' : 'Keywords'}
                        placeholder={form.values.source === 'url' ? 'https://...' : 'TypeScript Remote'}
                        {...form.getInputProps('keywords')}
                    />
                    <Checkbox
                        label="Nur Remote"
                        {...form.getInputProps('remoteOnly', { type: 'checkbox' })}
                    />
                    <NumberInput label="Min. Gehalt (EUR/Jahr, 0 = egal)" min={0} {...form.getInputProps('minSalary')} />
                    <Checkbox
                        label="Aktiv (läuft alle 6h automatisch)"
                        {...form.getInputProps('enabled', { type: 'checkbox' })}
                    />
                    <Group justify="flex-end">
                        <Button variant="subtle" onClick={onClose}>
                            Abbrechen
                        </Button>
                        <Button type="submit">{initial ? 'Speichern' : 'Anlegen'}</Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
}

function AgentProfileModal({ opened, onClose }: { opened: boolean; onClose: () => void }) {
    const [profile, setProfile] = useState<AgentProfile | null>(null);

    useEffect(() => {
        if (!opened) return;
        window.api.agents.getProfile().then(setProfile);
    }, [opened]);

    if (!profile) return null;

    const save = async () => {
        await window.api.agents.setProfile(profile);
        notifications.show({ color: 'green', message: 'Profil gespeichert.' });
        onClose();
    };

    return (
        <Modal opened={opened} onClose={onClose} title="Bewerbungs-Profil für Scoring" size="md">
            <Stack gap="md">
                <Text size="sm" c="dimmed">
                    Anhand dieses Profils bewertet die LLM jede gefundene Stelle mit 0–100 Passungs-Score.
                </Text>
                <TextInput
                    label="Gewünschter Stack"
                    placeholder="TypeScript, Next.js, React Native"
                    value={profile.stackKeywords}
                    onChange={(e) => setProfile({ ...profile, stackKeywords: e.currentTarget.value })}
                />
                <Checkbox
                    label="Remote bevorzugt"
                    checked={profile.remotePreferred}
                    onChange={(e) =>
                        setProfile({ ...profile, remotePreferred: e.currentTarget.checked })
                    }
                />
                <NumberInput
                    label="Minimum-Gehalt (EUR/Jahr)"
                    min={0}
                    value={profile.minSalary}
                    onChange={(v) => setProfile({ ...profile, minSalary: Number(v) || 0 })}
                />
                <TextInput
                    label="No-Gos (nicht interessierend)"
                    placeholder="Java-only, C#-only, PHP-only"
                    value={profile.antiStack}
                    onChange={(e) => setProfile({ ...profile, antiStack: e.currentTarget.value })}
                />
                <Group justify="flex-end">
                    <Button onClick={save}>Speichern</Button>
                </Group>
            </Stack>
        </Modal>
    );
}
