import { TextInput } from '@mantine/core';
import { IconDownload } from '@tabler/icons-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GhostBtn } from '../../primitives/GhostBtn';
import { Label } from '../../primitives/Label';
import type { UseOllama } from './useOllama';

interface Props {
    ollama: UseOllama;
}

/**
 * Bottom catch-all: pull a model whose name isn't in the curated catalog.
 * Disabled when Ollama is offline so the user gets a hint via the start
 * banner instead of a silent failure.
 */
export function CustomPullField({ ollama }: Props) {
    const { t } = useTranslation();
    const [name, setName] = useState('');

    const submit = () => {
        const trimmed = name.trim();
        if (!trimmed) return;
        setName('');
        ollama.pull(trimmed);
    };

    return (
        <div>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 6,
                }}
            >
                <Label>{t('settings.customSection', 'Eigenes Modell')}</Label>
                <div style={{ flex: 1, height: 1, background: 'var(--rule)' }} />
            </div>
            <div
                style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'flex-end',
                    padding: '12px 14px',
                    background: 'var(--card)',
                    border: '1px solid var(--rule)',
                }}
            >
                <TextInput
                    label={t('settings.customModelLabel', 'Modellname')}
                    placeholder="z.B. mixtral:8x7b"
                    value={name}
                    onChange={(e) => setName(e.currentTarget.value)}
                    description={t(
                        'settings.customModelHint',
                        'Beliebiger Ollama-Modellname aus ollama.com/library',
                    )}
                    style={{ flex: 1 }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') submit();
                    }}
                />
                <GhostBtn
                    onClick={submit}
                    disabled={!name.trim() || !ollama.status?.running}
                >
                    <IconDownload size={12} />
                    <span>{t('settings.pull', 'Laden')}</span>
                </GhostBtn>
            </div>
        </div>
    );
}
