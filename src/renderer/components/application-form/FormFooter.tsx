import { IconSend, IconTrash } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { ApplicationRecord } from '../../../preload/index';
import { GhostBtn } from '../primitives/GhostBtn';
import { Kbd } from '../primitives/Kbd';

interface Props {
    initial: ApplicationRecord | null;
    onDelete?: (id: string) => void;
    onEmail?: () => void;
    onCancel: () => void;
    onSubmit: () => void;
    onClose: () => void;
}

export function FormFooter({
    initial,
    onDelete,
    onEmail,
    onCancel,
    onSubmit,
    onClose,
}: Props) {
    const { t } = useTranslation();

    return (
        <div
            style={{
                display: 'flex',
                gap: 6,
                padding: 12,
                borderTop: '1px solid var(--rule)',
                background: 'var(--paper-2)',
                flexShrink: 0,
                alignItems: 'center',
            }}
        >
            {initial && onDelete && (
                <GhostBtn
                    onClick={() => {
                        if (
                            confirm(
                                t('confirm.deleteApplication', {
                                    name: initial.companyName,
                                }),
                            )
                        ) {
                            onDelete(initial.id);
                            onClose();
                        }
                    }}
                    style={{ color: 'var(--rust)' }}
                >
                    <IconTrash size={12} />
                    <span>{t('common.delete')}</span>
                </GhostBtn>
            )}
            <div style={{ flex: 1 }} />
            {initial && onEmail && (
                <GhostBtn onClick={onEmail}>
                    <IconSend size={12} />
                    <span>{t('email.send')}</span>
                </GhostBtn>
            )}
            <GhostBtn onClick={onCancel}>
                <span>{t('common.cancel')}</span>
            </GhostBtn>
            <GhostBtn
                active
                onClick={onSubmit}
                style={{
                    background: 'var(--ink)',
                    color: 'var(--paper)',
                    borderColor: 'var(--ink)',
                }}
            >
                <span>{initial ? t('common.save') : t('common.create')}</span>
                <Kbd tone="dark">⌘⏎</Kbd>
            </GhostBtn>
        </div>
    );
}
