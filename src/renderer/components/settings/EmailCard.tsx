import {
    Checkbox,
    MultiSelect,
    NumberInput,
    PasswordInput,
    SimpleGrid,
    Switch,
    Textarea,
    TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { MailboxInfoDto, UserProfileDto } from '../../../preload/index';
import { GhostBtn } from '../primitives/GhostBtn';
import { SettingsHint, SettingsSection } from './SettingsSection';

/**
 * Guess the matching IMAP host for a given SMTP host. Most providers follow
 * the smtp.X.tld ↔ imap.X.tld pattern; when it does not match, the user can
 * still override manually.
 */
function guessImapHost(smtpHost: string): string {
    if (!smtpHost) return '';
    if (smtpHost.startsWith('smtp.')) return 'imap.' + smtpHost.slice('smtp.'.length);
    if (smtpHost.startsWith('mail.')) return smtpHost;
    return '';
}

export function EmailCard() {
    const { t } = useTranslation();
    const [profile, setProfile] = useState<UserProfileDto | null>(null);
    const [savingProfile, setSavingProfile] = useState(false);
    const [testingSmtp, setTestingSmtp] = useState(false);
    const [testingImap, setTestingImap] = useState(false);
    const [loadingMailboxes, setLoadingMailboxes] = useState(false);
    const [discoveredMailboxes, setDiscoveredMailboxes] = useState<MailboxInfoDto[]>([]);
    const [encAvailable, setEncAvailable] = useState<boolean | null>(null);

    useEffect(() => {
        window.api.profile.get().then(setProfile);
        window.api.profile.encryptionAvailable().then(setEncAvailable);
    }, []);

    const updateProfile = <K extends keyof UserProfileDto>(key: K, value: UserProfileDto[K]) => {
        setProfile((prev) => (prev ? { ...prev, [key]: value } : prev));
    };

    const saveProfile = async () => {
        if (!profile) return;
        setSavingProfile(true);
        try {
            const next = await window.api.profile.set(profile);
            setProfile(next);
            notifications.show({ color: 'green', message: t('profilePage.saved') });
        } finally {
            setSavingProfile(false);
        }
    };

    const persistProfile = async () => {
        if (!profile) return;
        setSavingProfile(true);
        try {
            await window.api.profile.set(profile);
        } finally {
            setSavingProfile(false);
        }
    };

    const testSmtp = async () => {
        if (!profile) return;
        await persistProfile();
        setTestingSmtp(true);
        try {
            const result = await window.api.email.verify();
            if (result.ok) {
                notifications.show({ color: 'green', message: t('profilePage.testOk') });
            } else {
                notifications.show({
                    color: 'red',
                    title: t('profilePage.testFailed'),
                    message: result.error ?? 'Unknown error',
                    autoClose: 10000,
                });
            }
        } catch (err) {
            notifications.show({
                color: 'red',
                title: t('profilePage.testFailed'),
                message: (err as Error).message,
                autoClose: 10000,
            });
        } finally {
            setTestingSmtp(false);
        }
    };

    const testImap = async () => {
        if (!profile) return;
        await persistProfile();
        setTestingImap(true);
        try {
            const result = await window.api.inbox.testImap();
            if (result.ok) {
                notifications.show({
                    color: 'green',
                    message: t('profilePage.imapTestOk', {
                        count: result.inboxMessages ?? 0,
                    }),
                });
            } else {
                notifications.show({
                    color: 'red',
                    title: t('profilePage.imapTestFailed'),
                    message: result.error ?? 'Unknown error',
                    autoClose: 10000,
                });
            }
        } catch (err) {
            notifications.show({
                color: 'red',
                title: t('profilePage.imapTestFailed'),
                message: (err as Error).message,
                autoClose: 10000,
            });
        } finally {
            setTestingImap(false);
        }
    };

    const loadMailboxes = async () => {
        if (!profile) return;
        await persistProfile();
        setLoadingMailboxes(true);
        try {
            const result = await window.api.inbox.listMailboxes();
            if (result.ok && result.mailboxes) {
                setDiscoveredMailboxes(result.mailboxes);
                notifications.show({
                    color: 'green',
                    message: t('profilePage.mailboxesLoaded', {
                        count: result.mailboxes.length,
                    }),
                });
            } else {
                notifications.show({
                    color: 'red',
                    title: t('profilePage.mailboxesLoadFailed'),
                    message: result.error ?? 'Unknown error',
                    autoClose: 10000,
                });
            }
        } catch (err) {
            notifications.show({
                color: 'red',
                title: t('profilePage.mailboxesLoadFailed'),
                message: (err as Error).message,
                autoClose: 10000,
            });
        } finally {
            setLoadingMailboxes(false);
        }
    };

    const mailboxOptions = useMemo(() => {
        const paths = new Set<string>();
        paths.add('INBOX');
        for (const m of discoveredMailboxes) paths.add(m.path);
        for (const p of profile?.imapMailboxes ?? []) paths.add(p);
        return Array.from(paths).sort((a, b) => {
            if (a === 'INBOX') return -1;
            if (b === 'INBOX') return 1;
            return a.localeCompare(b);
        });
    }, [discoveredMailboxes, profile?.imapMailboxes]);

    const copyFromSmtp = () => {
        if (!profile) return;
        setProfile({
            ...profile,
            imapUser: profile.imapUser || profile.smtpUser,
            imapPassword: profile.imapPassword || profile.smtpPassword,
            imapHost: profile.imapHost || guessImapHost(profile.smtpHost),
        });
    };

    if (!profile) return null;

    const saveBtn = (
        <GhostBtn
            active
            onClick={saveProfile}
            disabled={savingProfile}
            style={{
                background: 'var(--ink)',
                color: 'var(--paper)',
                borderColor: 'var(--ink)',
            }}
        >
            <span>
                {savingProfile ? t('common.saving', 'Saving…') : t('profilePage.save')}
            </span>
        </GhostBtn>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <SettingsSection label={t('profilePage.smtpSection')}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <SettingsHint>{t('profilePage.smtpHint')}</SettingsHint>
                    {encAvailable === true && (
                        <SettingsHint tone="ok">{t('profilePage.encryptionOn')}</SettingsHint>
                    )}
                    {encAvailable === false && (
                        <SettingsHint tone="warn">{t('profilePage.encryptionOff')}</SettingsHint>
                    )}
                </div>

                <div style={{ marginTop: 14 }}>
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
                </div>

                <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {saveBtn}
                    <GhostBtn
                        onClick={testSmtp}
                        disabled={!profile.smtpHost || !profile.smtpUser}
                    >
                        <span>
                            {testingSmtp
                                ? t('common.testing', 'Testing…')
                                : t('profilePage.testSmtp')}
                        </span>
                    </GhostBtn>
                </div>
            </SettingsSection>

            <SettingsSection label={t('profilePage.imapSection')}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <SettingsHint>{t('profilePage.imapHint')}</SettingsHint>
                </div>

                <div style={{ marginTop: 14 }}>
                    <SimpleGrid cols={2} spacing="sm">
                        <TextInput
                            label={t('profilePage.imapHost')}
                            placeholder="imap.gmail.com"
                            value={profile.imapHost}
                            onChange={(e) => updateProfile('imapHost', e.currentTarget.value)}
                        />
                        <NumberInput
                            label={t('profilePage.imapPort')}
                            min={1}
                            max={65535}
                            value={profile.imapPort}
                            onChange={(v) =>
                                updateProfile('imapPort', typeof v === 'number' ? v : 993)
                            }
                        />
                        <TextInput
                            label={t('profilePage.imapUser')}
                            value={profile.imapUser}
                            onChange={(e) => updateProfile('imapUser', e.currentTarget.value)}
                        />
                        <PasswordInput
                            label={t('profilePage.imapPassword')}
                            value={profile.imapPassword}
                            onChange={(e) =>
                                updateProfile('imapPassword', e.currentTarget.value)
                            }
                        />
                        <Checkbox
                            label={t('profilePage.imapSecure')}
                            checked={profile.imapSecure}
                            onChange={(e) =>
                                updateProfile('imapSecure', e.currentTarget.checked)
                            }
                            mt="xl"
                        />
                    </SimpleGrid>
                </div>

                <div style={{ marginTop: 16 }}>
                    <MultiSelect
                        label={t('profilePage.imapMailboxesLabel')}
                        description={t('profilePage.imapMailboxesHint')}
                        placeholder={
                            discoveredMailboxes.length === 0
                                ? t('profilePage.imapMailboxesPlaceholder')
                                : undefined
                        }
                        data={mailboxOptions}
                        value={profile.imapMailboxes ?? ['INBOX']}
                        onChange={(values) =>
                            updateProfile(
                                'imapMailboxes',
                                values.length > 0 ? values : ['INBOX'],
                            )
                        }
                        searchable
                        clearable={false}
                        nothingFoundMessage={t('profilePage.imapMailboxesPlaceholder')}
                    />
                </div>

                <div style={{ marginTop: 14 }}>
                    <Switch
                        label={t('profilePage.imapIncludeReadLabel')}
                        description={t('profilePage.imapIncludeReadHint')}
                        checked={profile.imapIncludeRead}
                        onChange={(e) =>
                            updateProfile('imapIncludeRead', e.currentTarget.checked)
                        }
                    />
                </div>

                <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {saveBtn}
                    <GhostBtn
                        onClick={testImap}
                        disabled={!profile.imapHost || !profile.imapUser}
                    >
                        <span>
                            {testingImap
                                ? t('common.testing', 'Testing…')
                                : t('profilePage.testImap')}
                        </span>
                    </GhostBtn>
                    <GhostBtn
                        onClick={loadMailboxes}
                        disabled={!profile.imapHost || !profile.imapUser}
                    >
                        <span>
                            {loadingMailboxes
                                ? t('common.loading', 'Loading…')
                                : t('profilePage.loadMailboxes')}
                        </span>
                    </GhostBtn>
                    <GhostBtn onClick={copyFromSmtp} disabled={!profile.smtpUser}>
                        <span>{t('profilePage.copyFromSmtp')}</span>
                    </GhostBtn>
                </div>
            </SettingsSection>

            <SettingsSection label={t('emailStyle.section', 'E-Mail-Stil')}>
                <div style={{ marginBottom: 12 }}>
                    <SettingsHint>
                        {t(
                            'emailStyle.hint',
                            'Zusatzanweisung für den LLM-Entwurf. Tonfall, Länge, Do/Don\'ts. Wird bei jedem Entwurf mitgeschickt.',
                        )}
                    </SettingsHint>
                </div>
                <Textarea
                    label={t('emailStyle.label', 'Instruktion')}
                    placeholder={t(
                        'emailStyle.placeholder',
                        'z.B. "Locker, nicht förmlich. Kein Buzzword-Bingo. Max. 4 Sätze im Hauptteil. Ich habe 6 Jahre Fullstack-Erfahrung."',
                    )}
                    autosize
                    minRows={4}
                    maxRows={10}
                    value={profile.emailInstruction}
                    onChange={(e) => updateProfile('emailInstruction', e.currentTarget.value)}
                />
                <div style={{ marginTop: 14 }}>{saveBtn}</div>
            </SettingsSection>
        </div>
    );
}
