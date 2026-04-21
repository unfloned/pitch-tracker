import {
    Alert,
    Badge,
    Button,
    Code,
    Divider,
    Drawer,
    Group,
    ScrollArea,
    SegmentedControl,
    Stack,
    Text,
    TextInput,
    useMantineColorScheme,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
    IconCheck,
    IconDownload,
    IconInfoCircle,
    IconMoon,
    IconPlayerPlay,
    IconRefresh,
    IconSun,
    IconX,
} from '@tabler/icons-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { setLanguage, type Language } from '../i18n';

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
    const { t, i18n } = useTranslation();
    const { colorScheme, setColorScheme } = useMantineColorScheme();
    const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
    const [ollamaModel, setOllamaModel] = useState('llama3.2:3b');
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<Status | null>(null);
    const [starting, setStarting] = useState(false);
    const [pulling, setPulling] = useState(false);
    const [version, setVersion] = useState<string>('');

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
        window.api.updater.currentVersion().then((v) => setVersion(v.version));
        refreshStatus();
    }, [opened, refreshStatus]);

    const save = async () => {
        setSaving(true);
        await window.api.llm.setConfig({ ollamaUrl, ollamaModel });
        setSaving(false);
        notifications.show({ color: 'green', message: t('settings.settingsSaved') });
        await refreshStatus();
    };

    const doStart = async () => {
        setStarting(true);
        const result = await window.api.llm.start();
        setStarting(false);
        await refreshStatus();
        if (result.started) {
            const method =
                result.method === 'already-running'
                    ? t('settings.ollamaAlreadyRunning')
                    : result.method === 'app'
                      ? t('settings.ollamaStartedApp')
                      : t('settings.ollamaStartedCli');
            notifications.show({
                color: 'green',
                icon: <IconCheck size={16} />,
                message: t('settings.ollamaStartedRunning', { method }),
            });
        } else {
            notifications.show({
                color: 'red',
                icon: <IconX size={16} />,
                title: t('settings.ollamaStartFailed'),
                message: result.message ?? 'Unknown error',
                autoClose: 10000,
            });
        }
    };

    const doPull = async () => {
        setPulling(true);
        notifications.show({
            id: 'pulling',
            loading: true,
            title: t('settings.downloadingTitle', { model: ollamaModel }),
            message: t('settings.downloadingHint'),
            autoClose: false,
            withCloseButton: false,
        });
        const result = await window.api.llm.pullModel(ollamaModel);
        setPulling(false);
        notifications.hide('pulling');
        if (result.ok) {
            notifications.show({
                color: 'green',
                message: t('settings.modelDownloaded', { model: ollamaModel }),
            });
            await refreshStatus();
        } else {
            notifications.show({
                color: 'red',
                title: t('settings.downloadFailed'),
                message: result.message ?? 'Unknown error',
            });
        }
    };

    const checkUpdate = async () => {
        const result = await window.api.updater.checkNow();
        if (result.dev) {
            notifications.show({ message: t('settings.devSkip') });
        } else if (result.updateAvailable) {
            notifications.show({
                color: 'blue',
                message: t('settings.updateAvailableNotify', { version: result.remoteVersion }),
            });
        } else {
            notifications.show({
                message: t('settings.onLatest', { version: result.currentVersion }),
            });
        }
    };

    const hasModel = status?.models.includes(ollamaModel) ?? false;

    return (
        <Drawer
            opened={opened}
            onClose={onClose}
            position="right"
            size="md"
            title={t('settings.title')}
            scrollAreaComponent={ScrollArea.Autosize}
        >
            <Stack gap="md">
                <Divider label={t('settings.appearance')} labelPosition="left" />
                <Group justify="space-between">
                    <Text fw={500}>{t('settings.theme')}</Text>
                    <SegmentedControl
                        value={colorScheme}
                        onChange={(v) => setColorScheme(v as 'light' | 'dark' | 'auto')}
                        data={[
                            {
                                value: 'light',
                                label: (
                                    <span style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                        <IconSun size={14} /> {t('settings.themeLight')}
                                    </span>
                                ),
                            },
                            {
                                value: 'dark',
                                label: (
                                    <span style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                        <IconMoon size={14} /> {t('settings.themeDark')}
                                    </span>
                                ),
                            },
                            {
                                value: 'auto',
                                label: <span style={{ whiteSpace: 'nowrap' }}>{t('settings.themeSystem')}</span>,
                            },
                        ]}
                        size="xs"
                    />
                </Group>

                <Group justify="space-between">
                    <Text fw={500}>{t('settings.language')}</Text>
                    <SegmentedControl
                        value={i18n.language.startsWith('de') ? 'de' : 'en'}
                        onChange={(v) => setLanguage(v as Language)}
                        data={[
                            { value: 'de', label: t('settings.languageGerman') },
                            { value: 'en', label: t('settings.languageEnglish') },
                        ]}
                        size="xs"
                    />
                </Group>

                <Divider label={t('settings.ollamaSection')} labelPosition="left" />

                <Group justify="space-between" align="center">
                    <Text fw={500}>{t('settings.status')}</Text>
                    {status === null ? (
                        <Badge color="gray">{t('settings.statusChecking')}</Badge>
                    ) : status.running ? (
                        <Badge color="green" leftSection={<IconCheck size={12} />}>
                            {t('settings.statusRunning')}
                        </Badge>
                    ) : (
                        <Badge color="red" leftSection={<IconX size={12} />}>
                            {t('settings.statusOffline')}
                        </Badge>
                    )}
                </Group>

                {status && !status.running && (
                    <Alert variant="light" color="yellow" icon={<IconInfoCircle size={16} />}>
                        {t('settings.ollamaOfflineHint', { url: ollamaUrl })}
                    </Alert>
                )}

                {status?.running && status.models.length > 0 && (
                    <Text size="xs" c="dimmed">
                        {t('settings.installedModels', { models: status.models.join(', ') })}
                    </Text>
                )}

                <Group>
                    <Button
                        variant="light"
                        leftSection={<IconRefresh size={16} />}
                        onClick={refreshStatus}
                    >
                        {t('common.refresh')}
                    </Button>
                    {!status?.running && (
                        <Button
                            leftSection={<IconPlayerPlay size={16} />}
                            onClick={doStart}
                            loading={starting}
                        >
                            {t('settings.startOllama')}
                        </Button>
                    )}
                    {status?.running && !hasModel && (
                        <Button
                            variant="light"
                            leftSection={<IconDownload size={16} />}
                            onClick={doPull}
                            loading={pulling}
                        >
                            {t('settings.downloadModel')}
                        </Button>
                    )}
                </Group>

                <Alert variant="light" icon={<IconInfoCircle size={16} />}>
                    {t('settings.installHint')}
                </Alert>

                <TextInput
                    label={t('settings.ollamaUrl')}
                    placeholder="http://localhost:11434"
                    value={ollamaUrl}
                    onChange={(e) => setOllamaUrl(e.currentTarget.value)}
                />

                <TextInput
                    label={t('settings.ollamaModel')}
                    placeholder="llama3.2:3b"
                    description={t('settings.ollamaModelHint')}
                    value={ollamaModel}
                    onChange={(e) => setOllamaModel(e.currentTarget.value)}
                />

                <Button onClick={save} loading={saving}>
                    {t('settings.save')}
                </Button>

                <Divider label={t('settings.app')} labelPosition="left" />
                <Group justify="space-between">
                    <Text size="sm">{t('settings.version')}</Text>
                    <Code>{version || '...'}</Code>
                </Group>
                <Button
                    variant="light"
                    leftSection={<IconRefresh size={16} />}
                    onClick={checkUpdate}
                >
                    {t('settings.checkForUpdate')}
                </Button>
            </Stack>
        </Drawer>
    );
}
