import { useTranslation } from 'react-i18next';
import { GhostBtn } from '../primitives/GhostBtn';
import { Label } from '../primitives/Label';

interface Props {
    filteredCount: number;
    totalCount: number;
    onGoToAgents: () => void;
}

export function PageHeader({ filteredCount, totalCount, onGoToAgents }: Props) {
    const { t } = useTranslation();
    return (
        <div>
            <Label>{t('tabs.candidates')}</Label>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 4 }}>
                <span
                    className="serif"
                    style={{
                        fontSize: 28,
                        fontWeight: 500,
                        color: 'var(--ink)',
                        letterSpacing: '-0.02em',
                        lineHeight: 1,
                    }}
                >
                    {t('tabs.candidates')}
                </span>
                <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                    {filteredCount} of {totalCount}
                </span>
                <div style={{ flex: 1 }} />
                <GhostBtn onClick={onGoToAgents}>
                    <span>{t('nav.agents')}</span>
                </GhostBtn>
            </div>
        </div>
    );
}
