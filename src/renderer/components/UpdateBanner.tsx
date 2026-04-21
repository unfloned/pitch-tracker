import { Alert, Button, Group } from '@mantine/core';
import { IconDownload, IconRefresh } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export function UpdateBanner() {
    const { t } = useTranslation();
    const [downloaded, setDownloaded] = useState<{ version: string } | null>(null);
    const [available, setAvailable] = useState<{ version: string } | null>(null);

    useEffect(() => {
        const offDown = window.api.on('updater:downloaded', (info: { version: string }) => {
            setDownloaded(info);
        });
        const offAvail = window.api.on('updater:available', (info: { version: string }) => {
            setAvailable(info);
        });
        return () => {
            offDown();
            offAvail();
        };
    }, []);

    if (downloaded) {
        return (
            <Alert
                color="green"
                icon={<IconRefresh size={16} />}
                title={t('updater.downloadedTitle', { version: downloaded.version })}
                withCloseButton
                onClose={() => setDownloaded(null)}
            >
                <Group justify="space-between">
                    <span>{t('updater.downloadedBody')}</span>
                    <Button
                        size="xs"
                        onClick={() => window.api.updater.installNow()}
                        leftSection={<IconRefresh size={14} />}
                    >
                        {t('updater.installNow')}
                    </Button>
                </Group>
            </Alert>
        );
    }

    if (available) {
        return (
            <Alert
                color="blue"
                icon={<IconDownload size={16} />}
                title={t('updater.availableTitle', { version: available.version })}
                withCloseButton
                onClose={() => setAvailable(null)}
            >
                {t('updater.availableBody')}
            </Alert>
        );
    }

    return null;
}
