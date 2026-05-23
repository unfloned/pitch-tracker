import { useTranslation } from 'react-i18next';

export function DashboardMasthead() {
    const { t } = useTranslation();
    return (
        <div>
            <div
                className="mono"
                style={{
                    fontSize: 11,
                    color: 'var(--text-faint)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    marginBottom: 10,
                }}
            >
                {t('dashboard.title')}
            </div>
            <div
                style={{
                    fontFamily: 'var(--f-ui)',
                    fontSize: 36,
                    fontWeight: 600,
                    color: 'var(--text)',
                    letterSpacing: '-0.025em',
                    lineHeight: 1.1,
                }}
            >
                {t('dashboard.subtitle')}
            </div>
        </div>
    );
}
