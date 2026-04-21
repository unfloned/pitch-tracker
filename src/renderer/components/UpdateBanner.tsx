import { Alert, Button, Group } from '@mantine/core';
import { IconDownload, IconRefresh } from '@tabler/icons-react';
import { useEffect, useState } from 'react';

export function UpdateBanner() {
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
                title={`Update ${downloaded.version} bereit`}
                withCloseButton
                onClose={() => setDownloaded(null)}
            >
                <Group justify="space-between">
                    <span>Installation beim nächsten Neustart — oder jetzt installieren.</span>
                    <Button
                        size="xs"
                        onClick={() => window.api.updater.installNow()}
                        leftSection={<IconRefresh size={14} />}
                    >
                        Jetzt installieren
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
                title={`Update ${available.version} verfügbar`}
                withCloseButton
                onClose={() => setAvailable(null)}
            >
                Wird im Hintergrund heruntergeladen, Install-Hinweis folgt.
            </Alert>
        );
    }

    return null;
}
