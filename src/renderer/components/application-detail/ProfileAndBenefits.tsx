import { useTranslation } from 'react-i18next';
import type { ApplicationRecord } from '../../../preload/index';
import { Label } from '../primitives/Label';

interface Props {
    app: ApplicationRecord;
}

/**
 * Two side-by-side cards: required profile bullets and benefits bullets.
 * Either card collapses away when empty, giving a 1- or 2-column grid.
 */
export function ProfileAndBenefits({ app }: Props) {
    const { t } = useTranslation();

    if (app.requiredProfile.length === 0 && app.benefits.length === 0) return null;

    const cols = app.requiredProfile.length > 0 && app.benefits.length > 0 ? '1fr 1fr' : '1fr';

    return (
        <div style={{ marginTop: 22 }}>
            <Label>{t('detail.profile.label', 'Profile & benefits')}</Label>
            <div
                style={{
                    marginTop: 8,
                    display: 'grid',
                    gridTemplateColumns: cols,
                    gap: 12,
                }}
            >
                {app.requiredProfile.length > 0 && (
                    <BulletCard
                        heading={t('detail.profile.required', 'Required')}
                        items={app.requiredProfile.slice(0, 6)}
                    />
                )}
                {app.benefits.length > 0 && (
                    <BulletCard
                        heading={t('detail.profile.benefits', 'Benefits')}
                        items={app.benefits.slice(0, 6)}
                    />
                )}
            </div>
        </div>
    );
}

function BulletCard({ heading, items }: { heading: string; items: string[] }) {
    return (
        <div style={{ padding: 10, background: 'var(--card)', border: '1px solid var(--rule)' }}>
            <span
                className="mono"
                style={{
                    fontSize: 9.5,
                    color: 'var(--ink-3)',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                }}
            >
                {heading}
            </span>
            <ul
                style={{
                    margin: '6px 0 0',
                    padding: 0,
                    listStyle: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                }}
            >
                {items.map((item, i) => (
                    <li
                        key={i}
                        style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.35 }}
                    >
                        · {item}
                    </li>
                ))}
            </ul>
        </div>
    );
}
