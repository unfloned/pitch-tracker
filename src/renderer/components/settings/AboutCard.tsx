import { notifications } from '@mantine/notifications';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GhostBtn } from '../primitives/GhostBtn';
import { SettingsRow, SettingsSection } from './SettingsSection';

/** App version + manual update check. */
export function AboutCard() {
    const { t } = useTranslation();
    const [version, setVersion] = useState<string>('');

    useEffect(() => {
        window.api.updater.currentVersion().then((v) => setVersion(v.version));
    }, []);

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

    return (
        <SettingsSection label={t('settings.app')}>
            <SettingsRow label={t('settings.version')}>
                <span
                    className="mono tnum"
                    style={{ fontSize: 12, color: 'var(--ink-2)', fontWeight: 500 }}
                >
                    {version || '...'}
                </span>
            </SettingsRow>
            <SettingsRow
                label={t('settings.checkForUpdate')}
                description={t('settings.checkForUpdateHint', 'Fetch latest release manifest')}
            >
                <GhostBtn onClick={checkUpdate}>
                    <span>{t('settings.checkForUpdate')}</span>
                </GhostBtn>
            </SettingsRow>
        </SettingsSection>
    );
}
