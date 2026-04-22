import { useTranslation } from 'react-i18next';
import { GhostBtn } from '../primitives/GhostBtn';
import { Kbd } from '../primitives/Kbd';
import { Label } from '../primitives/Label';

interface Props {
    now: Date;
}

export function Masthead({ now }: Props) {
    const { t } = useTranslation();
    return (
        <div
            style={{
                padding: '22px 28px 14px',
                borderBottom: '2px solid var(--ink)',
                background: 'var(--paper)',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                }}
            >
                <div>
                    <Label>{t('analytics.title')} · Report</Label>
                    <div
                        className="serif"
                        style={{
                            fontSize: 36,
                            fontWeight: 500,
                            color: 'var(--ink)',
                            letterSpacing: '-0.02em',
                            marginTop: 4,
                            lineHeight: 1,
                        }}
                    >
                        {now.getFullYear()} · last 12 weeks
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <GhostBtn>
                        <span>Range</span>
                        <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>
                            12 weeks
                        </span>
                    </GhostBtn>
                    <GhostBtn>
                        <span>Export</span>
                        <Kbd>⌘E</Kbd>
                    </GhostBtn>
                </div>
            </div>
        </div>
    );
}
