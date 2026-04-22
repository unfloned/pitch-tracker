import { IconEyeOff, IconStar } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { GhostBtn } from '../primitives/GhostBtn';

interface Props {
    count: number;
    onFavorite: () => void;
    onIgnore: () => void;
}

export function BulkActions({ count, onFavorite, onIgnore }: Props) {
    const { t } = useTranslation();
    if (count === 0) return null;
    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: 8,
            }}
        >
            <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                {t('candidates.selected', { count })}
            </span>
            <GhostBtn onClick={onFavorite}>
                <IconStar size={12} />
                <span>{t('candidates.star')}</span>
            </GhostBtn>
            <GhostBtn onClick={onIgnore}>
                <IconEyeOff size={12} />
                <span>{t('candidates.dismiss')}</span>
            </GhostBtn>
        </div>
    );
}
