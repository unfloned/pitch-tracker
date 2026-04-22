import { useTranslation } from 'react-i18next';
import { Label } from '../primitives/Label';

export function DashboardMasthead() {
    const { t } = useTranslation();
    return (
        <div>
            <Label>Inbox</Label>
            <div
                className="serif"
                style={{
                    fontSize: 28,
                    fontWeight: 500,
                    color: 'var(--ink)',
                    letterSpacing: '-0.02em',
                    marginTop: 4,
                    lineHeight: 1.05,
                }}
            >
                {t('dashboard.title')}
            </div>
            <div
                className="mono"
                style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}
            >
                {t('dashboard.subtitle')}
            </div>
        </div>
    );
}
