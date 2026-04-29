import { useTranslation } from 'react-i18next';
import { Label } from '../../primitives/Label';
import type { UseOllama } from './useOllama';

interface Props {
    ollama: UseOllama;
}

/**
 * Top banner showing which model is configured as the default for scoring,
 * extraction, etc. Warns when the active model isn't installed locally.
 */
export function ActiveModelBanner({ ollama }: Props) {
    const { t } = useTranslation();
    const isMissing =
        ollama.status?.running === true && !ollama.installed.has(ollama.activeModel);

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                marginBottom: 16,
                background: 'var(--paper-2)',
                border: '1px solid var(--rule)',
            }}
        >
            <Label>{t('settings.activeModel', 'Aktives Modell')}</Label>
            <span
                className="mono"
                style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}
            >
                {ollama.activeModel}
            </span>
            <span style={{ flex: 1 }} />
            {isMissing && (
                <span
                    className="mono"
                    style={{ fontSize: 10, color: 'var(--rust)', letterSpacing: '0.06em' }}
                >
                    {t('settings.notInstalledShort', 'NICHT INSTALLIERT')}
                </span>
            )}
        </div>
    );
}
