import { ActionIcon, Button, Group, Tooltip } from '@mantine/core';
import { IconDownload, IconPlus, IconSettings } from '@tabler/icons-react';

interface Props {
    onNew: () => void;
    onSettings: () => void;
    onExport: () => void;
}

export function Toolbar({ onNew, onSettings, onExport }: Props) {
    return (
        <Group gap="sm">
            <Tooltip label="Excel-Export">
                <ActionIcon variant="subtle" size="lg" onClick={onExport}>
                    <IconDownload size={18} />
                </ActionIcon>
            </Tooltip>
            <Tooltip label="Einstellungen (Ollama)">
                <ActionIcon variant="subtle" size="lg" onClick={onSettings}>
                    <IconSettings size={18} />
                </ActionIcon>
            </Tooltip>
            <Button leftSection={<IconPlus size={16} />} onClick={onNew}>
                Neuer Eintrag
            </Button>
        </Group>
    );
}
