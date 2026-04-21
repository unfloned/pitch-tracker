import { ActionIcon, Button, Group, Tooltip } from '@mantine/core';
import { IconDownload, IconPlus, IconSettings } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

interface Props {
    onNew: () => void;
    onSettings: () => void;
    onExport: () => void;
}

export function Toolbar({ onNew, onSettings, onExport }: Props) {
    const { t } = useTranslation();
    return (
        <Group gap="sm">
            <Tooltip label={t('toolbar.export')}>
                <ActionIcon variant="subtle" size="lg" onClick={onExport}>
                    <IconDownload size={18} />
                </ActionIcon>
            </Tooltip>
            <Tooltip label={t('toolbar.settings')}>
                <ActionIcon variant="subtle" size="lg" onClick={onSettings}>
                    <IconSettings size={18} />
                </ActionIcon>
            </Tooltip>
            <Button leftSection={<IconPlus size={16} />} onClick={onNew}>
                {t('toolbar.newEntry')}
            </Button>
        </Group>
    );
}
