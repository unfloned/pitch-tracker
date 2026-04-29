import { useTranslation } from 'react-i18next';
import { Label } from '../../primitives/Label';
import type { OllamaStatus } from './useOllama';

interface Props {
    status: OllamaStatus | null;
}

/** Tiny status indicator for the section header: dot + label. */
export function StatusDot({ status }: Props) {
    const { t } = useTranslation();
    let color = 'var(--ink-4)';
    let labelKey = 'settings.statusChecking';
    if (status) {
        color = status.running ? 'var(--moss)' : 'var(--rust)';
        labelKey = status.running ? 'settings.statusRunning' : 'settings.statusOffline';
    }
    return (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <div
                style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: color,
                }}
            />
            <Label color="var(--ink-2)">{t(labelKey)}</Label>
        </div>
    );
}
