import { IconChevronDown } from '@tabler/icons-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GhostBtn } from '../primitives/GhostBtn';
import { ActiveModelBanner } from './ollama/ActiveModelBanner';
import { AdvancedConfig } from './ollama/AdvancedConfig';
import { CustomPullField } from './ollama/CustomPullField';
import { ModelBrowser } from './ollama/ModelBrowser';
import { StatusDot } from './ollama/StatusDot';
import { useOllama } from './ollama/useOllama';
import { SettingsHint, SettingsSection } from './SettingsSection';

/**
 * Top-level Ollama settings card. Composes the smaller pieces in
 * `./ollama/`. State + side effects live in `useOllama`; this component
 * only handles layout + the toggle for the advanced config block.
 */
export function OllamaCard() {
    const { t } = useTranslation();
    const ollama = useOllama();
    const [advancedOpen, setAdvancedOpen] = useState(false);

    return (
        <SettingsSection
            label={t('settings.ollamaSection')}
            right={<StatusDot status={ollama.status} />}
        >
            {ollama.status && !ollama.status.running && (
                <div style={{ marginBottom: 12 }}>
                    <SettingsHint tone="warn">
                        {t('settings.ollamaOfflineHint', { url: ollama.ollamaUrl })}
                    </SettingsHint>
                </div>
            )}

            <div
                style={{
                    display: 'flex',
                    gap: 8,
                    marginBottom: 16,
                    flexWrap: 'wrap',
                    alignItems: 'center',
                }}
            >
                <GhostBtn onClick={ollama.refreshStatus}>
                    <span>{t('common.refresh')}</span>
                </GhostBtn>
                {!ollama.status?.running && (
                    <GhostBtn
                        active
                        onClick={ollama.startServer}
                        disabled={ollama.starting}
                        style={{
                            background: 'var(--ink)',
                            color: 'var(--paper)',
                            borderColor: 'var(--ink)',
                        }}
                    >
                        <span>
                            {ollama.starting
                                ? t('common.working', 'Working…')
                                : t('settings.startOllama')}
                        </span>
                    </GhostBtn>
                )}
                <div style={{ flex: 1 }} />
                <GhostBtn onClick={() => setAdvancedOpen((v) => !v)}>
                    <span>{t('settings.advanced', 'Erweitert')}</span>
                    <IconChevronDown
                        size={11}
                        style={{
                            transform: advancedOpen ? 'rotate(180deg)' : 'none',
                            transition: 'transform 150ms',
                            opacity: 0.6,
                        }}
                    />
                </GhostBtn>
            </div>

            <AdvancedConfig open={advancedOpen} ollama={ollama} />

            <ActiveModelBanner ollama={ollama} />

            <ModelBrowser ollama={ollama} />

            <div style={{ marginTop: 18 }}>
                <CustomPullField ollama={ollama} />
            </div>
        </SettingsSection>
    );
}
