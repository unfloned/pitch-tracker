import { Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import {
    IconArrowBackUp,
    IconEyeOff,
    IconRefresh,
    IconStar,
    IconTrash,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { CandidateBucket } from './useCandidates';
import { GhostBtn } from '../primitives/GhostBtn';

interface Props {
    count: number;
    bucket: CandidateBucket;
    onFavorite: () => void;
    onIgnore: () => void;
    onRestore: () => void;
    onDelete: () => void;
    onRescore: () => void;
}

export function BulkActions({
    count,
    bucket,
    onFavorite,
    onIgnore,
    onRestore,
    onDelete,
    onRescore,
}: Props) {
    const { t } = useTranslation();
    if (count === 0) return null;

    const confirmDelete = () => {
        modals.openConfirmModal({
            title: t('candidates.confirmDeleteTitle', { count }),
            children: (
                <Text size="sm" c="dimmed">
                    {t('candidates.confirmDeleteBody')}
                </Text>
            ),
            labels: {
                confirm: t('candidates.confirmDeleteAction'),
                cancel: t('common.cancel'),
            },
            confirmProps: { color: 'red' },
            onConfirm: onDelete,
        });
    };

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
            {bucket === 'active' && (
                <>
                    <GhostBtn onClick={onFavorite}>
                        <IconStar size={12} />
                        <span>{t('candidates.star')}</span>
                    </GhostBtn>
                    <GhostBtn onClick={onIgnore}>
                        <IconEyeOff size={12} />
                        <span>{t('candidates.dismiss')}</span>
                    </GhostBtn>
                </>
            )}
            <GhostBtn onClick={onRescore}>
                <IconRefresh size={12} />
                <span>{t('candidates.rescore')}</span>
            </GhostBtn>
            {bucket === 'ignored' && (
                <GhostBtn onClick={onRestore}>
                    <IconArrowBackUp size={12} />
                    <span>{t('candidates.restore')}</span>
                </GhostBtn>
            )}
            <GhostBtn onClick={confirmDelete}>
                <IconTrash size={12} />
                <span>{t('candidates.deleteForever')}</span>
            </GhostBtn>
        </div>
    );
}
