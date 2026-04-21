import {
    Alert,
    Badge,
    Box,
    Button,
    Card,
    Checkbox,
    Code,
    Divider,
    Group,
    NumberInput,
    PasswordInput,
    SegmentedControl,
    SimpleGrid,
    Stack,
    Text,
    Textarea,
    TextInput,
    Title,
    useMantineColorScheme,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
    IconArchive,
    IconCheck,
    IconDownload,
    IconFile,
    IconFolderOpen,
    IconInfoCircle,
    IconLock,
    IconLockOpen,
    IconMoon,
    IconPlayerPlay,
    IconRefresh,
    IconSun,
    IconUpload,
    IconUser,
    IconX,
} from '@tabler/icons-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { setLanguage, type Language } from '../i18n';
import type { UserProfileDto } from '../../preload/index';

interface Status {
    running: boolean;
    models: string[];
    error?: string;
}

export function SettingsPage() {
    const { t, i18n } = useTranslation();
    const { colorScheme, setColorScheme } = useMantineColorScheme();
    const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
    const [ollamaModel, setOllamaModel] = useState('llama3.2:3b');
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<Status | null>(null);
    const [starting, setStarting] = useState(false);
    const [pulling, setPulling] = useState(false);
    const [version, setVersion] = useState<string>('');
    const [profile, setProfile] = useState<UserProfileDto | null>(null);
    const [savingProfile, setSavingProfile] = useState(false);
    const [testingSmtp, setTestingSmtp] = useState(false);
    const [backupBusy, setBackupBusy] = useState(false);
    const [restoreBusy, setRestoreBusy] = useState(false);
    const [encAvailable, setEncAvailable] = useState<boolean | null>(null);

    const refreshStatus = useCallback(async () => {
        const s = await window.api.llm.status();
        setStatus(s);
    }, []);

    useEffect(() => {
        window.api.llm.getConfig().then((config) => {
            setOllamaUrl(config.ollamaUrl);
            setOllamaModel(config.ollamaModel);
        });
        window.api.updater.currentVersion().then((v) => setVersion(v.version));
        window.api.profile.get().then(setProfile);
        window.api.profile.encryptionAvailable().then(setEncAvailable);
        refreshStatus();
    }, [refreshStatus]);

    const saveProfile = async () => {
        if (!profile) return;
        setSavingProfile(true);
        const next = await window.api.profile.set(profile);
        setProfile(next);
        setSavingProfile(false);
        notifications.show({
            color: 'green',
            icon: <IconCheck size={16} />,
            message: t('profilePage.saved'),
        });
    };

    const pickCv = async () => {
        const result = await window.api.profile.pickCv();
        if (result.canceled || !result.path || !profile) return;
        const next = await window.api.profile.set({ cvPath: result.path });
        setProfile(next);
    };

    const testSmtp = async () => {
        if (!profile) return;
        setSavingProfile(true);
        await window.api.profile.set(profile);
        setSavingProfile(false);
        setTestingSmtp(true);
        const result = await window.api.email.verify();
        setTestingSmtp(false);
        if (result.ok) {
            notifications.show({
                color: 'green',
                icon: <IconCheck size={16} />,
                message: t('profilePage.testOk'),
            });
        } else {
            notifications.show({
                color: 'red',
                icon: <IconX size={16} />,
                title: t('profilePage.testFailed'),
                message: result.error ?? 'Unknown error',
                autoClose: 10000,
            });
        }
    };

    const doBackup = async () => {
        setBackupBusy(true);
        const result = await window.api.backup.create();
        setBackupBusy(false);
        if (result.canceled) return;
        if (result.ok) {
            notifications.show({
                color: 'green',
                icon: <IconCheck size={16} />,
                message: t('backup.exportOk', { size: Math.round((result.size ?? 0) / 1024) }),
            });
        } else {
            notifications.show({
                color: 'red',
                icon: <IconX size={16} />,
                title: t('backup.exportFailed'),
                message: result.error ?? 'Unknown error',
            });
        }
    };

    const doRestore = async () => {
        if (!confirm(t('backup.confirmRestore'))) return;
        setRestoreBusy(true);
        const result = await window.api.backup.restore();
        setRestoreBusy(false);
        if (result.canceled) return;
        if (result.ok) {
            notifications.show({
                color: 'green',
                icon: <IconCheck size={16} />,
                message: t('backup.restoreOk', { count: result.restoredFiles ?? 0 }),
                autoClose: 10000,
            });
        } else {
            notifications.show({
                color: 'red',
                icon: <IconX size={16} />,
                title: t('backup.restoreFailed'),
                message: result.error ?? 'Unknown error',
            });
        }
    };

    const updateProfile = <K extends keyof UserProfileDto>(key: K, value: UserProfileDto[K]) => {
        setProfile((prev) => (prev ? { ...prev, [key]: value } : prev));
    };

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
        <Stack gap="xl">
            <Stack gap={2}>
                <Title order={2}>{t('settings.title')}</Title>
                <Text c="dimmed" size="sm">
                    {t('settings.version')} {version || '-'}
                </Text>
            </Stack>

            <Card withBorder padding="lg">
                <Title order={5} mb="md">
                    {t('settings.appearance')}
                </Title>
                <Stack gap="md">
                    <Group justify="space-between">
                        <Stack gap={0}>
                            <Text size="sm" fw={500}>
                                {t('settings.theme')}
                            </Text>
                        </Stack>
                        <SegmentedControl
                            value={colorScheme}
                            onChange={(v) => setColorScheme(v as 'light' | 'dark' | 'auto')}
                            data={[
                                {
                                    value: 'light',
                                    label: (
                                        <span
                                            style={{
                                                whiteSpace: 'nowrap',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 4,
                                            }}
                                        >
                                            <IconSun size={14} /> {t('settings.themeLight')}
                                        </span>
                                    ),
                                },
                                {
                                    value: 'dark',
                                    label: (
                                        <span
                                            style={{
                                                whiteSpace: 'nowrap',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 4,
                                            }}
                                        >
                                            <IconMoon size={14} /> {t('settings.themeDark')}
                                        </span>
                                    ),
                                },
                                {
                                    value: 'auto',
                                    label: (
                                        <span style={{ whiteSpace: 'nowrap' }}>
                                            {t('settings.themeSystem')}
                                        </span>
                                    ),
                                },
                            ]}
                            size="xs"
                        />
                    </Group>

                    <Group justify="space-between">
                        <Text size="sm" fw={500}>
                            {t('settings.language')}
                        </Text>
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
                </Stack>
            </Card>

            <Card withBorder padding="lg">
                <Group gap="xs" mb="md">
                    <IconUser size={18} />
                    <Title order={5}>{t('profilePage.section')}</Title>
                </Group>
                {profile && (
                    <Stack gap="md">
                        <SimpleGrid cols={2} spacing="sm">
                            <TextInput
                                label={t('profilePage.fullName')}
                                description={t('profilePage.fullNameHint')}
                                value={profile.fullName}
                                onChange={(e) => updateProfile('fullName', e.currentTarget.value)}
                            />
                            <TextInput
                                label={t('profilePage.email')}
                                value={profile.email}
                                onChange={(e) => updateProfile('email', e.currentTarget.value)}
                            />
                            <TextInput
                                label={t('profilePage.phone')}
                                value={profile.phone}
                                onChange={(e) => updateProfile('phone', e.currentTarget.value)}
                            />
                        </SimpleGrid>
                        <Textarea
                            label={t('profilePage.signature')}
                            placeholder={t('profilePage.signaturePlaceholder')}
                            autosize
                            minRows={2}
                            maxRows={6}
                            value={profile.signature}
                            onChange={(e) => updateProfile('signature', e.currentTarget.value)}
                        />
                        <Box>
                            <Text size="sm" fw={500} mb={4}>
                                {t('profilePage.cv')}
                            </Text>
                            <Group gap="sm">
                                <Button
                                    variant="light"
                                    leftSection={<IconFile size={16} />}
                                    onClick={pickCv}
                                >
                                    {t('profilePage.pickCv')}
                                </Button>
                                <Text size="sm" c={profile.cvPath ? undefined : 'dimmed'} truncate>
                                    {profile.cvPath || t('profilePage.cvNone')}
                                </Text>
                            </Group>
                        </Box>

                        <Divider label={t('profilePage.smtpSection')} labelPosition="left" />
                        <Alert variant="light" icon={<IconInfoCircle size={16} />}>
                            {t('profilePage.smtpHint')}
                        </Alert>
                        {encAvailable === true && (
                            <Alert
                                variant="light"
                                color="green"
                                icon={<IconLock size={16} />}
                            >
                                {t('profilePage.encryptionOn')}
                            </Alert>
                        )}
                        {encAvailable === false && (
                            <Alert
                                variant="light"
                                color="yellow"
                                icon={<IconLockOpen size={16} />}
                            >
                                {t('profilePage.encryptionOff')}
                            </Alert>
                        )}
                        <SimpleGrid cols={2} spacing="sm">
                            <TextInput
                                label={t('profilePage.smtpHost')}
                                placeholder="smtp.gmail.com"
                                value={profile.smtpHost}
                                onChange={(e) => updateProfile('smtpHost', e.currentTarget.value)}
                            />
                            <NumberInput
                                label={t('profilePage.smtpPort')}
                                min={1}
                                max={65535}
                                value={profile.smtpPort}
                                onChange={(v) =>
                                    updateProfile('smtpPort', typeof v === 'number' ? v : 587)
                                }
                            />
                            <TextInput
                                label={t('profilePage.smtpUser')}
                                value={profile.smtpUser}
                                onChange={(e) => updateProfile('smtpUser', e.currentTarget.value)}
                            />
                            <PasswordInput
                                label={t('profilePage.smtpPassword')}
                                value={profile.smtpPassword}
                                onChange={(e) =>
                                    updateProfile('smtpPassword', e.currentTarget.value)
                                }
                            />
                            <TextInput
                                label={t('profilePage.smtpFromName')}
                                value={profile.smtpFromName}
                                onChange={(e) =>
                                    updateProfile('smtpFromName', e.currentTarget.value)
                                }
                            />
                            <Checkbox
                                label={t('profilePage.smtpSecure')}
                                checked={profile.smtpSecure}
                                onChange={(e) =>
                                    updateProfile('smtpSecure', e.currentTarget.checked)
                                }
                                mt="xl"
                            />
                        </SimpleGrid>

                        <Group>
                            <Button onClick={saveProfile} loading={savingProfile}>
                                {t('profilePage.save')}
                            </Button>
                            <Button
                                variant="light"
                                onClick={testSmtp}
                                loading={testingSmtp}
                                disabled={!profile.smtpHost || !profile.smtpUser}
                            >
                                {t('profilePage.testSmtp')}
                            </Button>
                        </Group>
                    </Stack>
                )}
            </Card>

            <Card withBorder padding="lg">
                <Group gap="xs" mb="md">
                    <IconArchive size={18} />
                    <Title order={5}>{t('backup.section')}</Title>
                </Group>
                <Text size="sm" c="dimmed" mb="md">
                    {t('backup.hint')}
                </Text>
                <Group>
                    <Button
                        variant="light"
                        leftSection={<IconUpload size={16} />}
                        onClick={doBackup}
                        loading={backupBusy}
                    >
                        {t('backup.export')}
                    </Button>
                    <Button
                        variant="light"
                        color="red"
                        leftSection={<IconFolderOpen size={16} />}
                        onClick={doRestore}
                        loading={restoreBusy}
                    >
                        {t('backup.restore')}
                    </Button>
                </Group>
            </Card>

            <Card withBorder padding="lg">
                <Group justify="space-between" mb="md">
                    <Title order={5}>{t('settings.ollamaSection')}</Title>
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
                    <Alert
                        variant="light"
                        color="yellow"
                        icon={<IconInfoCircle size={16} />}
                        mb="md"
                    >
                        {t('settings.ollamaOfflineHint', { url: ollamaUrl })}
                    </Alert>
                )}

                {status?.running && status.models.length > 0 && (
                    <Text size="xs" c="dimmed" mb="md">
                        {t('settings.installedModels', { models: status.models.join(', ') })}
                    </Text>
                )}

                <Group mb="md">
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

                <Alert variant="light" icon={<IconInfoCircle size={16} />} mb="md">
                    {t('settings.installHint')}
                </Alert>

                <Stack gap="sm">
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

                    <Group>
                        <Button onClick={save} loading={saving}>
                            {t('settings.save')}
                        </Button>
                    </Group>
                </Stack>
            </Card>

            <Card withBorder padding="lg">
                <Title order={5} mb="md">
                    {t('settings.app')}
                </Title>
                <Group justify="space-between" mb="sm">
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
            </Card>
        </Stack>
    );
}
