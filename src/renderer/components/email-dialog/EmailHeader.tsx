import { useTranslation } from 'react-i18next';
import type { ApplicationRecord } from '../../../preload/index';
import { Label } from '../primitives/Label';
import type { Mode } from './types';

interface Props {
    application: ApplicationRecord | null;
    mode: Mode;
    onModeChange: (mode: Mode) => void;
    profileSet: boolean | null;
    smtpOk: boolean | null;
    onClose: () => void;
}

export function EmailHeader({
    application,
    mode,
    onModeChange,
    profileSet,
    smtpOk,
    onClose,
}: Props) {
    const { t } = useTranslation();
    return (
        <div
            style={{
                padding: '18px 22px 14px',
                borderBottom: '1px solid var(--rule)',
                background: 'var(--paper)',
                flexShrink: 0,
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <Label>{t('email.title', 'Email entwerfen')}</Label>
                <div style={{ flex: 1 }} />
                <ModeToggle mode={mode} onChange={onModeChange} />
                <button
                    type="button"
                    onClick={onClose}
                    style={{
                        width: 22,
                        height: 22,
                        border: '1px solid var(--rule)',
                        background: 'var(--card)',
                        fontSize: 11,
                        color: 'var(--ink-3)',
                        cursor: 'pointer',
                        borderRadius: 3,
                    }}
                >
                    ✕
                </button>
            </div>

            <div
                className="serif"
                style={{
                    fontSize: 22,
                    fontWeight: 500,
                    color: 'var(--ink)',
                    letterSpacing: '-0.015em',
                    lineHeight: 1.15,
                }}
            >
                {application?.jobTitle || t('email.genericSubject', 'Bewerbung')}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 4 }}>
                {application?.companyName || '—'}
            </div>

            {profileSet === false && (
                <StatusHint tone="rust">{t('email.smtpNotConfigured')}</StatusHint>
            )}
            {profileSet === true && smtpOk === false && (
                <StatusHint tone="rust">{t('email.smtpVerifyFailed')}</StatusHint>
            )}
        </div>
    );
}

function ModeToggle({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
    const { t } = useTranslation();
    const modes: Mode[] = ['edit', 'preview'];
    return (
        <div
            style={{
                display: 'inline-flex',
                border: '1px solid var(--rule-strong)',
                borderRadius: 4,
                overflow: 'hidden',
            }}
        >
            {modes.map((m, i) => (
                <button
                    key={m}
                    type="button"
                    onClick={() => onChange(m)}
                    style={{
                        padding: '4px 10px',
                        fontSize: 11,
                        fontWeight: mode === m ? 600 : 500,
                        fontFamily: 'var(--f-ui)',
                        color: mode === m ? 'var(--ink)' : 'var(--ink-3)',
                        background: mode === m ? 'var(--paper-2)' : 'var(--card)',
                        border: 'none',
                        borderRight: i < modes.length - 1 ? '1px solid var(--rule-strong)' : 'none',
                        cursor: 'pointer',
                        textTransform: 'capitalize',
                    }}
                >
                    {m === 'edit'
                        ? t('email.modeEdit', 'Entwurf')
                        : t('email.modePreview', 'Vorschau')}
                </button>
            ))}
        </div>
    );
}

function StatusHint({
    tone,
    children,
}: {
    tone: 'rust' | 'moss';
    children: React.ReactNode;
}) {
    return (
        <div
            style={{
                marginTop: 12,
                padding: '8px 12px',
                background: 'var(--card)',
                border: '1px solid var(--rule)',
                borderLeft: `3px solid var(--${tone})`,
                fontSize: 12,
                color: 'var(--ink-2)',
            }}
        >
            {children}
        </div>
    );
}
