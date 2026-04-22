import { useTranslation } from 'react-i18next';
import { Label } from '../primitives/Label';

export function ThinkingIndicator() {
    const { t } = useTranslation();
    return (
        <div
            style={{
                marginBottom: 28,
                paddingLeft: 16,
                borderLeft: '2px solid var(--accent)',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 10,
                    marginBottom: 6,
                }}
            >
                <Label color="var(--accent-ink)">Assistant</Label>
            </div>
            <div className="mono" style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                {t('chat.thinking')}
                <span
                    style={{
                        borderLeft: '2px solid var(--ink)',
                        marginLeft: 4,
                        animation: 'blink 1s infinite',
                    }}
                />
            </div>
        </div>
    );
}
