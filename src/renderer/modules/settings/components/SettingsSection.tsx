import { ReactNode } from 'react';

interface Props {
    label: string;
    subtitle?: string;
    right?: ReactNode;
    children: ReactNode;
}

/**
 * v2 section wrapper: uppercase label, optional subline, hairline.
 */
export function SettingsSection({ label, subtitle, right, children }: Props) {
    return (
        <section style={{ marginBottom: 32 }}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 12,
                    paddingBottom: 10,
                    marginBottom: 18,
                    borderBottom: '1px solid var(--hairline)',
                }}
            >
                <span
                    style={{
                        fontSize: 12,
                        fontWeight: 500,
                        color: 'var(--text-muted)',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                    }}
                >
                    {label}
                </span>
                {subtitle && (
                    <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>{subtitle}</span>
                )}
                <div style={{ flex: 1 }} />
                {right}
            </div>
            <div>{children}</div>
        </section>
    );
}

interface RowProps {
    label: string;
    description?: string;
    children: ReactNode;
}

/**
 * Key / value row used inside a SettingsSection - label on the left, control
 * on the right, optional helper text below the label.
 */
export function SettingsRow({ label, description, children }: RowProps) {
    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(160px, 240px) 1fr',
                gap: 18,
                padding: '14px 0',
                borderBottom: '1px solid var(--hairline)',
                alignItems: 'center',
            }}
        >
            <div>
                <div style={{ fontSize: 13.5, color: 'var(--text)', fontWeight: 500 }}>{label}</div>
                {description && (
                    <div
                        style={{
                            fontSize: 12,
                            color: 'var(--text-muted)',
                            marginTop: 3,
                            lineHeight: 1.45,
                        }}
                    >
                        {description}
                    </div>
                )}
            </div>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    gap: 8,
                }}
            >
                {children}
            </div>
        </div>
    );
}

interface HintProps {
    tone?: 'info' | 'ok' | 'warn';
    children: ReactNode;
}

/** v2 hint: surface + accent-soft-tinted left edge, no harsh border. */
export function SettingsHint({ tone = 'info', children }: HintProps) {
    const accent =
        tone === 'ok' ? 'var(--success)' : tone === 'warn' ? 'var(--danger)' : 'var(--accent)';
    const tint =
        tone === 'ok' ? 'var(--success-soft)' : tone === 'warn' ? 'var(--danger-soft)' : 'var(--accent-soft)';
    return (
        <div
            style={{
                padding: '12px 14px',
                background: tint,
                borderLeft: `2px solid ${accent}`,
                borderRadius: 8,
                fontSize: 12.5,
                lineHeight: 1.55,
                color: 'var(--text)',
            }}
        >
            {children}
        </div>
    );
}
