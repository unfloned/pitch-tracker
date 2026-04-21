import {
    Alert,
    Badge,
    Button,
    Code,
    Group,
    Modal,
    Stack,
    Text,
    TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconDownload, IconInfoCircle, IconPlayerPlay, IconRefresh, IconX } from '@tabler/icons-react';
import { useCallback, useEffect, useState } from 'react';

interface Props {
    opened: boolean;
    onClose: () => void;
}

interface Status {
    running: boolean;
    models: string[];
    error?: string;
}

export function SettingsModal({ opened, onClose }: Props) {
    const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
    const [ollamaModel, setOllamaModel] = useState('qwen2.5:7b-instruct');
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<Status | null>(null);
    const [starting, setStarting] = useState(false);
    const [pulling, setPulling] = useState(false);

    const refreshStatus = useCallback(async () => {
        const s = await window.api.llm.status();
        setStatus(s);
    }, []);

    useEffect(() => {
        if (!opened) return;
        window.api.llm.getConfig().then((config) => {
            setOllamaUrl(config.ollamaUrl);
            setOllamaModel(config.ollamaModel);
        });
        refreshStatus();
    }, [opened, refreshStatus]);

    const save = async () => {
        setSaving(true);
        await window.api.llm.setConfig({ ollamaUrl, ollamaModel });
        setSaving(false);
        notifications.show({ color: 'green', message: 'Einstellungen gespeichert.' });
        await refreshStatus();
    };

    const doStart = async () => {
        setStarting(true);
        const result = await window.api.llm.start();
        setStarting(false);
        await refreshStatus();
        if (result.started) {
            notifications.show({
                color: 'green',
                icon: <IconCheck size={16} />,
                message: `Ollama läuft (${result.method === 'already-running' ? 'war schon an' : result.method === 'app' ? 'Desktop-App' : 'CLI'}).`,
            });
        } else {
            notifications.show({
                color: 'red',
                icon: <IconX size={16} />,
                title: 'Ollama konnte nicht gestartet werden',
                message: result.message ?? 'Unbekannter Fehler',
                autoClose: 10000,
            });
        }
    };

    const doPull = async () => {
        setPulling(true);
        notifications.show({
            id: 'pulling',
            loading: true,
            title: `${ollamaModel} wird geladen`,
            message: 'Dauert je nach Modellgröße 2–10 Minuten. Fenster kannst du offen lassen.',
            autoClose: false,
            withCloseButton: false,
        });
        const result = await window.api.llm.pullModel(ollamaModel);
        setPulling(false);
        notifications.hide('pulling');
        if (result.ok) {
            notifications.show({ color: 'green', message: `${ollamaModel} geladen.` });
            await refreshStatus();
        } else {
            notifications.show({
                color: 'red',
                title: 'Download fehlgeschlagen',
                message: result.message ?? 'Unbekannter Fehler',
            });
        }
    };

    const hasModel = status?.models.includes(ollamaModel) ?? false;

    return (
        <Modal opened={opened} onClose={onClose} title="Einstellungen" size="md">
            <Stack gap="md">
                <Group justify="space-between" align="center">
                    <Text fw={500}>Ollama-Status</Text>
                    {status === null ? (
                        <Badge color="gray">Prüfe…</Badge>
                    ) : status.running ? (
                        <Badge color="green" leftSection={<IconCheck size={12} />}>
                            Läuft
                        </Badge>
                    ) : (
                        <Badge color="red" leftSection={<IconX size={12} />}>
                            Offline
                        </Badge>
                    )}
                </Group>

                {status && !status.running && (
                    <Alert variant="light" color="yellow" icon={<IconInfoCircle size={16} />}>
                        Ollama antwortet nicht auf <Code>{ollamaUrl}</Code>. Klick "Starten" unten,
                        oder manuell <Code>ollama serve</Code> im Terminal.
                    </Alert>
                )}

                {status?.running && status.models.length > 0 && (
                    <Text size="xs" c="dimmed">
                        Installierte Modelle: {status.models.join(', ')}
                    </Text>
                )}

                <Group>
                    <Button
                        variant="light"
                        leftSection={<IconRefresh size={16} />}
                        onClick={refreshStatus}
                    >
                        Neu prüfen
                    </Button>
                    {!status?.running && (
                        <Button
                            leftSection={<IconPlayerPlay size={16} />}
                            onClick={doStart}
                            loading={starting}
                        >
                            Ollama starten
                        </Button>
                    )}
                    {status?.running && !hasModel && (
                        <Button
                            variant="light"
                            leftSection={<IconDownload size={16} />}
                            onClick={doPull}
                            loading={pulling}
                        >
                            Modell herunterladen
                        </Button>
                    )}
                </Group>

                <Alert variant="light" icon={<IconInfoCircle size={16} />}>
                    Installation: <Code>brew install ollama</Code> (CLI) oder Desktop-App von{' '}
                    <Code>ollama.com</Code>.
                </Alert>

                <TextInput
                    label="Ollama API-URL"
                    placeholder="http://localhost:11434"
                    value={ollamaUrl}
                    onChange={(e) => setOllamaUrl(e.currentTarget.value)}
                />

                <TextInput
                    label="Ollama Modell"
                    placeholder="qwen2.5:7b-instruct"
                    description="Empfehlung: qwen2.5:7b-instruct (guter JSON-Output) oder llama3.2:3b (sehr schnell, kleiner)"
                    value={ollamaModel}
                    onChange={(e) => setOllamaModel(e.currentTarget.value)}
                />

                <Button onClick={save} loading={saving}>
                    Speichern
                </Button>
            </Stack>
        </Modal>
    );
}
