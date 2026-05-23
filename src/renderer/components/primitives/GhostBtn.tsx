import type { CSSProperties, MouseEventHandler, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    onClick?: MouseEventHandler<HTMLButtonElement>;
    active?: boolean;
    disabled?: boolean;
    style?: CSSProperties;
    title?: string;
}

/** v2 quiet button: no border at rest, soft surface hover. */
export function GhostBtn({ children, onClick, active = false, disabled, style, title }: Props) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={title}
            style={{
                fontFamily: 'var(--f-ui)',
                fontSize: 12.5,
                fontWeight: 500,
                color: active ? 'var(--text)' : 'var(--text-muted)',
                background: active ? 'var(--surface-2)' : 'transparent',
                border: 'none',
                borderRadius: 7,
                padding: '5px 10px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.45 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                transition: 'background 120ms, color 120ms',
                WebkitAppRegion: 'no-drag',
                ...style,
            } as CSSProperties}
            onMouseEnter={(e) => {
                if (!active && !disabled) {
                    e.currentTarget.style.background = 'var(--surface-2)';
                    e.currentTarget.style.color = 'var(--text)';
                }
            }}
            onMouseLeave={(e) => {
                if (!active && !disabled) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-muted)';
                }
            }}
        >
            {children}
        </button>
    );
}
