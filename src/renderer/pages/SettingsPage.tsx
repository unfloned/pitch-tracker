import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AboutCard } from '../modules/settings/components/AboutCard';
import { AppearanceCard } from '../modules/settings/components/AppearanceCard';
import { BackupCard } from '../modules/settings/components/BackupCard';
import { EmailCard } from '../modules/settings/components/EmailCard';
import { OllamaCard } from '../modules/settings/components/OllamaCard';
import { ProfileCard } from '../modules/settings/components/ProfileCard';
import { SettingsLayout, type SettingsTab } from '../modules/settings/components/SettingsLayout';

export function SettingsPage() {
    const { t } = useTranslation();
    const [version, setVersion] = useState<string>('');

    useEffect(() => {
        window.api.updater.currentVersion().then((v) => setVersion(v.version));
    }, []);

    const tabs: SettingsTab[] = [
        {
            id: 'general',
            label: t('settings.nav.general', 'Allgemein'),
            hint: t('settings.nav.generalHint', 'Theme · Sprache · Zoom'),
            render: () => <AppearanceCard />,
        },
        {
            id: 'profile',
            label: t('settings.nav.profile', 'Profil'),
            hint: t('settings.nav.profileHint', 'Name · Signatur · CV'),
            render: () => <ProfileCard />,
        },
        {
            id: 'email',
            label: t('settings.nav.email', 'E-Mail'),
            hint: t('settings.nav.emailHint', 'SMTP · IMAP · Stil'),
            render: () => <EmailCard />,
        },
        {
            id: 'ollama',
            label: t('settings.nav.ollama', 'Ollama'),
            hint: t('settings.nav.ollamaHint', 'Lokales LLM · Modelle'),
            render: () => <OllamaCard />,
        },
        {
            id: 'backup',
            label: t('settings.nav.backup', 'Backup'),
            hint: t('settings.nav.backupHint', 'Export · Import'),
            render: () => <BackupCard />,
        },
        {
            id: 'about',
            label: t('settings.nav.about', 'Über'),
            hint: t('settings.nav.aboutHint', 'Version · Updates'),
            render: () => <AboutCard />,
        },
    ];

    const header = (
        <div style={{ marginBottom: 32 }}>
            <h1
                className="serif"
                style={{
                    fontSize: 32,
                    margin: 0,
                    color: 'var(--ink)',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.1,
                }}
            >
                {t('settings.title')}
            </h1>
            <div
                className="mono"
                style={{
                    fontSize: 11,
                    color: 'var(--ink-3)',
                    marginTop: 6,
                    letterSpacing: '0.04em',
                }}
            >
                v{version || '0.0.0'} · local · {t('settings.subtitle', 'configure once, forget')}
            </div>
        </div>
    );

    return <SettingsLayout tabs={tabs} defaultTab="general" header={header} />;
}
