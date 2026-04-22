import type { CSSProperties, MouseEventHandler, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    onClick?: MouseEventHandler<HTMLButtonElement>;
    active?: boolean;
    disabled?: boolean;
    style?: CSSProperties;
    title?: string;
}

/** Quiet keyboard-driven button. 1px border, paper-2 fill when active. */
export function GhostBtn({ children, onClick, active = false, disabled, style, title }: Props) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={title}
            style={{
                fontFamily: 'var(--f-ui)',
                fontSize: 12,
                fontWeight: 500,
                color: active ? 'var(--ink)' : 'var(--ink-2)',
                background: active ? 'var(--paper-2)' : 'transparent',
                border: '1px solid ' + (active ? 'var(--rule-strong)' : 'var(--rule)'),
                borderRadius: 4,
                padding: '4px 9px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.45 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                transition: 'background 120ms, border-color 120ms',
                ...style,
            }}
            onMouseEnter={(e) => {
                if (!active && !disabled) {
                    e.currentTarget.style.background = 'var(--card)';
                    e.currentTarget.style.borderColor = 'var(--rule-strong)';
                }
            }}
            onMouseLeave={(e) => {
                if (!active && !disabled) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = 'var(--rule)';
                }
            }}
        >
            {children}
        </button>
    );
}
