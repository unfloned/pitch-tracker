import { IconCheck, IconDownload, IconTrash, IconX } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { PullProgressEvent } from '../../../../preload/index';
import { GhostBtn } from '../../primitives/GhostBtn';
import type { RecommendedModel } from './catalog';
import { PullProgress } from './PullProgress';

interface Props {
    model: RecommendedModel;
    isFirst: boolean;
    installed: boolean;
    isActive: boolean;
    progress: PullProgressEvent | undefined;
    canPull: boolean;
    onUse: () => void;
    onPull: () => void;
    onCancel: () => void;
    onRemove: () => void;
}

/** Single model row in the browser. Status badge + actions on the right. */
export function ModelRow({
    model,
    isFirst,
    installed,
    isActive,
    progress,
    canPull,
    onUse,
    onPull,
    onCancel,
    onRemove,
}: Props) {
    const { t } = useTranslation();
    const pulling = !!progress && !progress.done;

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                borderTop: isFirst ? 'none' : '1px solid var(--rule)',
            }}
        >
            <div style={{ minWidth: 0 }}>
                <ModelLabel model={model} installed={installed} isActive={isActive} />
                <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{model.note}</div>
                {pulling && progress && (
                    <div style={{ marginTop: 6 }}>
                        <PullProgress progress={progress} />
                    </div>
                )}
            </div>
            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                {pulling ? (
                    <GhostBtn onClick={onCancel} title={t('common.cancel')}>
                        <IconX size={12} />
                        <span>{t('common.cancel')}</span>
                    </GhostBtn>
                ) : installed ? (
                    <>
                        {!isActive && (
                            <GhostBtn onClick={onUse}>
                                <span>{t('settings.useModel', 'Verwenden')}</span>
                            </GhostBtn>
                        )}
                        <GhostBtn onClick={onRemove} title={t('settings.removeModel', 'Entfernen')}>
                            <IconTrash size={12} />
                        </GhostBtn>
                    </>
                ) : (
                    <GhostBtn onClick={onPull} disabled={!canPull}>
                        <IconDownload size={12} />
                        <span>{t('settings.pull', 'Laden')}</span>
                    </GhostBtn>
                )}
            </div>
        </div>
    );
}

function ModelLabel({
    model,
    installed,
    isActive,
}: {
    model: RecommendedModel;
    installed: boolean;
    isActive: boolean;
}) {
    const { t } = useTranslation();
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 2,
            }}
        >
            <span
                className="mono"
                style={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: 'var(--ink)',
                }}
            >
                {model.name}
            </span>
            {isActive && (
                <span
                    className="mono"
                    style={{
                        fontSize: 9.5,
                        fontWeight: 600,
                        color: 'var(--accent-ink)',
                        background: 'var(--accent)',
                        padding: '1px 5px',
                        letterSpacing: '0.08em',
                    }}
                >
                    AKTIV
                </span>
            )}
            {installed && !isActive && (
                <span
                    className="mono"
                    style={{
                        fontSize: 9.5,
                        fontWeight: 600,
                        color: 'var(--moss)',
                        letterSpacing: '0.08em',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                    }}
                >
                    <IconCheck size={10} />
                    {t('settings.installedShort', 'INSTALLIERT')}
                </span>
            )}
        </div>
    );
}
