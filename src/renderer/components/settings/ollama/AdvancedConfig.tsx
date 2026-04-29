import { Collapse, TextInput } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { GhostBtn } from '../../primitives/GhostBtn';
import type { UseOllama } from './useOllama';

interface Props {
    open: boolean;
    ollama: UseOllama;
}

/**
 * Hidden-by-default URL config block. Most users never touch this; we tuck
 * it behind a toggle so the model browser stays the focus.
 */
export function AdvancedConfig({ open, ollama }: Props) {
    const { t } = useTranslation();
    return (
        <Collapse expanded={open}>
            <div
                style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'flex-end',
                    padding: '12px 14px',
                    marginBottom: 16,
                    background: 'var(--card)',
                    border: '1px solid var(--rule)',
                    borderLeft: '3px solid var(--accent)',
                }}
            >
                <TextInput
                    label={t('settings.ollamaUrl')}
                    placeholder="http://localhost:11434"
                    value={ollama.ollamaUrl}
                    onChange={(e) => ollama.setOllamaUrl(e.currentTarget.value)}
                    style={{ flex: 1 }}
                />
                <GhostBtn onClick={ollama.saveUrl} disabled={ollama.savingUrl}>
                    <span>
                        {ollama.savingUrl ? t('common.saving', 'Saving…') : t('settings.save')}
                    </span>
                </GhostBtn>
            </div>
        </Collapse>
    );
}
