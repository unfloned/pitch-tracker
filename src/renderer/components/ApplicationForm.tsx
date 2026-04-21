import {
    Alert,
    Badge,
    Button,
    Divider,
    Drawer,
    Group,
    NumberInput,
    ScrollArea,
    Select,
    SimpleGrid,
    Stack,
    TagsInput,
    Text,
    Textarea,
    TextInput,
    Tooltip,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import '@mantine/dates/styles.css';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
    IconAlertCircle,
    IconSparkles,
    IconTargetArrow,
    IconTrash,
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import {
    ApplicationStatus,
    PRIORITY_LABEL,
    Priority,
    REMOTE_LABEL,
    RemoteType,
    STATUS_LABEL,
    STATUS_ORDER,
} from '@shared/application';
import type { ApplicationRecord } from '../../preload/index';

interface Props {
    opened: boolean;
    onClose: () => void;
    initial: ApplicationRecord | null;
    onSaved: () => void;
    onDelete?: (id: string) => void;
}

interface FormValues {
    jobUrl: string;
    companyName: string;
    companyWebsite: string;
    jobTitle: string;
    jobDescription: string;
    location: string;
    remote: RemoteType;
    salaryMin: number;
    salaryMax: number;
    salaryCurrency: string;
    stack: string;
    status: ApplicationStatus;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    notes: string;
    tags: string;
    priority: Priority;
    requiredProfile: string[];
    benefits: string[];
    matchScore: number;
    matchReason: string;
    source: string;
    appliedAt: Date | null;
}

const DEFAULTS: FormValues = {
    jobUrl: '',
    companyName: '',
    companyWebsite: '',
    jobTitle: '',
    jobDescription: '',
    location: '',
    remote: 'onsite',
    salaryMin: 0,
    salaryMax: 0,
    salaryCurrency: 'EUR',
    stack: '',
    status: 'draft',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    notes: '',
    tags: '',
    priority: 'medium',
    requiredProfile: [],
    benefits: [],
    matchScore: 0,
    matchReason: '',
    source: '',
    appliedAt: null,
};

function scoreColor(score: number): string {
    if (score >= 90) return 'teal';
    if (score >= 70) return 'green';
    if (score >= 50) return 'yellow';
    if (score > 0) return 'orange';
    return 'gray';
}

export function ApplicationFormModal({ opened, onClose, initial, onSaved, onDelete }: Props) {
    const form = useForm<FormValues>({ initialValues: DEFAULTS });
    const [extracting, setExtracting] = useState(false);
    const [assessing, setAssessing] = useState(false);

    useEffect(() => {
        if (!opened) return;
        if (initial) {
            form.setValues({
                ...DEFAULTS,
                ...initial,
                requiredProfile: initial.requiredProfile ?? [],
                benefits: initial.benefits ?? [],
                appliedAt: initial.appliedAt ? new Date(initial.appliedAt) : null,
            });
        } else {
            form.setValues(DEFAULTS);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [opened, initial]);

    const doExtract = async () => {
        const url = form.values.jobUrl.trim();
        if (!url) {
            notifications.show({ color: 'yellow', message: 'Bitte zuerst eine URL eintragen.' });
            return;
        }
        setExtracting(true);
        try {
            const data = await window.api.llm.extract(url);
            form.setValues((v) => ({
                ...v,
                companyName: data.companyName || v.companyName,
                jobTitle: data.jobTitle || v.jobTitle,
                location: data.location || v.location,
                remote: data.remote || v.remote,
                salaryMin: data.salaryMin || v.salaryMin,
                salaryMax: data.salaryMax || v.salaryMax,
                stack: data.stack || v.stack,
                jobDescription: data.jobDescription || v.jobDescription,
                requiredProfile: data.requiredProfile.length ? data.requiredProfile : v.requiredProfile,
                benefits: data.benefits.length ? data.benefits : v.benefits,
                source: data.source || v.source,
            }));
            notifications.show({ color: 'green', message: 'Daten aus URL extrahiert.' });
        } catch (err) {
            notifications.show({
                color: 'red',
                title: 'LLM-Extraktion fehlgeschlagen',
                message: (err as Error).message,
                icon: <IconAlertCircle size={16} />,
                autoClose: 8000,
            });
        } finally {
            setExtracting(false);
        }
    };

    const doAssessFit = async () => {
        setAssessing(true);
        try {
            const result = await window.api.llm.assessFit(form.values);
            form.setFieldValue('matchScore', result.score);
            form.setFieldValue('matchReason', result.reason);
            notifications.show({
                color: scoreColor(result.score),
                title: `Passung: ${result.score}/100`,
                message: result.reason,
                icon: <IconTargetArrow size={16} />,
                autoClose: 8000,
            });
        } catch (err) {
            notifications.show({
                color: 'red',
                title: 'Passungsprüfung fehlgeschlagen',
                message: (err as Error).message,
                autoClose: 8000,
            });
        } finally {
            setAssessing(false);
        }
    };

    const submit = async (values: FormValues) => {
        if (initial) {
            await window.api.applications.update(initial.id, values);
        } else {
            await window.api.applications.create(values);
        }
        onSaved();
    };

    return (
        <Drawer
            opened={opened}
            onClose={onClose}
            title={
                <Group gap="xs">
                    <Text fw={600}>{initial ? 'Eintrag bearbeiten' : 'Neuer Eintrag'}</Text>
                    {form.values.matchScore > 0 && (
                        <Badge color={scoreColor(form.values.matchScore)} variant="light">
                            {form.values.matchScore}/100
                        </Badge>
                    )}
                </Group>
            }
            position="right"
            size="xl"
            scrollAreaComponent={ScrollArea.Autosize}
            overlayProps={{ backgroundOpacity: 0.3, blur: 2 }}
        >
            <form onSubmit={form.onSubmit(submit)}>
                <Stack gap="md">
                    <Alert variant="light" color="accent" icon={<IconSparkles size={16} />}>
                        URL einfügen → Auto-Fill → LLM extrahiert Firma, Titel, Stack, Profil, Benefits.
                    </Alert>

                    <Group align="end">
                        <TextInput
                            label="Job-URL"
                            placeholder="https://..."
                            flex={1}
                            {...form.getInputProps('jobUrl')}
                        />
                        <Tooltip label="Lokale LLM extrahiert Felder">
                            <Button
                                loading={extracting}
                                onClick={doExtract}
                                leftSection={<IconSparkles size={16} />}
                                variant="light"
                            >
                                Auto-Fill
                            </Button>
                        </Tooltip>
                    </Group>

                    <Divider label="Firma & Job" labelPosition="left" />
                    <SimpleGrid cols={2} spacing="sm">
                        <TextInput label="Firma" {...form.getInputProps('companyName')} />
                        <TextInput
                            label="Firmen-Website"
                            placeholder="https://..."
                            {...form.getInputProps('companyWebsite')}
                        />
                        <TextInput label="Jobtitel" {...form.getInputProps('jobTitle')} />
                        <TextInput
                            label="Ort"
                            placeholder="z.B. Berlin / leer bei Remote"
                            {...form.getInputProps('location')}
                        />
                        <Select
                            label="Remote-Typ"
                            data={(['onsite', 'hybrid', 'remote'] as RemoteType[]).map((v) => ({
                                value: v,
                                label: REMOTE_LABEL[v],
                            }))}
                            {...form.getInputProps('remote')}
                        />
                        <TextInput label="Quelle (Portal)" {...form.getInputProps('source')} />
                    </SimpleGrid>

                    <TextInput
                        label="Stack"
                        placeholder="TypeScript, Next.js, Postgres"
                        {...form.getInputProps('stack')}
                    />

                    <Divider label="Anforderungen & Benefits" labelPosition="left" />
                    <TagsInput
                        label="Anforderungen an dich"
                        description="Enter für neuen Eintrag, Komma trennt ebenfalls"
                        placeholder="z.B. 3+ Jahre TypeScript"
                        {...form.getInputProps('requiredProfile')}
                        clearable
                        splitChars={[',', ';']}
                    />
                    <TagsInput
                        label="Benefits"
                        description="Enter für neuen Eintrag"
                        placeholder="z.B. 30 Tage Urlaub, Jobrad, Workation"
                        {...form.getInputProps('benefits')}
                        clearable
                        splitChars={[',', ';']}
                    />

                    <Divider label="Gehalt & Status" labelPosition="left" />
                    <SimpleGrid cols={4} spacing="sm">
                        <NumberInput
                            label="Gehalt Min"
                            min={0}
                            {...form.getInputProps('salaryMin')}
                        />
                        <NumberInput
                            label="Gehalt Max"
                            min={0}
                            {...form.getInputProps('salaryMax')}
                        />
                        <TextInput
                            label="Währung"
                            maxLength={3}
                            {...form.getInputProps('salaryCurrency')}
                        />
                        <Select
                            label="Priorität"
                            data={(['low', 'medium', 'high'] as Priority[]).map((v) => ({
                                value: v,
                                label: PRIORITY_LABEL[v],
                            }))}
                            {...form.getInputProps('priority')}
                        />
                    </SimpleGrid>
                    <SimpleGrid cols={2} spacing="sm">
                        <Select
                            label="Status"
                            data={STATUS_ORDER.map((s) => ({ value: s, label: STATUS_LABEL[s] }))}
                            {...form.getInputProps('status')}
                        />
                        <DateInput
                            label="Beworben am"
                            clearable
                            valueFormat="DD.MM.YYYY"
                            {...form.getInputProps('appliedAt')}
                        />
                    </SimpleGrid>

                    <Divider label="Kontakt" labelPosition="left" />
                    <SimpleGrid cols={3} spacing="sm">
                        <TextInput label="Name" {...form.getInputProps('contactName')} />
                        <TextInput label="E-Mail" {...form.getInputProps('contactEmail')} />
                        <TextInput label="Telefon" {...form.getInputProps('contactPhone')} />
                    </SimpleGrid>

                    <Divider label="Beschreibung & Notizen" labelPosition="left" />
                    <Textarea
                        label="Job-Beschreibung"
                        autosize
                        minRows={2}
                        maxRows={8}
                        {...form.getInputProps('jobDescription')}
                    />
                    <Textarea
                        label="Eigene Notizen"
                        autosize
                        minRows={2}
                        maxRows={8}
                        {...form.getInputProps('notes')}
                    />
                    <TextInput
                        label="Tags (Komma-separiert)"
                        placeholder="startup, remote-first, gut"
                        {...form.getInputProps('tags')}
                    />

                    <Divider label="Passungs-Check" labelPosition="left" />
                    {form.values.matchScore > 0 ? (
                        <Alert
                            variant="light"
                            color={scoreColor(form.values.matchScore)}
                            icon={<IconTargetArrow size={16} />}
                            title={`Passung: ${form.values.matchScore}/100`}
                        >
                            {form.values.matchReason || 'Noch keine Begründung'}
                        </Alert>
                    ) : (
                        <Text size="sm" c="dimmed">
                            Noch nicht geprüft. Klick auf "Passung prüfen" unten.
                        </Text>
                    )}
                    <Button
                        variant="light"
                        onClick={doAssessFit}
                        loading={assessing}
                        leftSection={<IconTargetArrow size={16} />}
                        disabled={!form.values.companyName && !form.values.jobTitle}
                    >
                        Passung prüfen (LLM)
                    </Button>

                    <Group justify="space-between" mt="xl" pb="md">
                        <div>
                            {initial && onDelete && (
                                <Button
                                    variant="subtle"
                                    color="red"
                                    leftSection={<IconTrash size={16} />}
                                    onClick={() => {
                                        if (confirm(`"${initial.companyName}" wirklich löschen?`)) {
                                            onDelete(initial.id);
                                            onClose();
                                        }
                                    }}
                                >
                                    Löschen
                                </Button>
                            )}
                        </div>
                        <Group>
                            <Button variant="subtle" onClick={onClose}>
                                Abbrechen
                            </Button>
                            <Button type="submit">{initial ? 'Speichern' : 'Anlegen'}</Button>
                        </Group>
                    </Group>
                </Stack>
            </form>
        </Drawer>
    );
}
