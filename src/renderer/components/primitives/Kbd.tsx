import type { CSSProperties, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    tone?: 'light' | 'dark';
    style?: CSSProperties;
}

/** Keyboard shortcut chip. Use tone="dark" on dark backgrounds. */
export function Kbd({ children, tone = 'light', style }: Props) {
    return (
        <span
            className="mono"
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 18,
                height: 18,
                padding: '0 5px',
                borderRadius: 3,
                border:
                    tone === 'dark'
                        ? '1px solid rgba(255,255,255,0.2)'
                        : '1px solid var(--rule-strong)',
                background: tone === 'dark' ? 'rgba(255,255,255,0.06)' : 'var(--paper-2)',
                color: tone === 'dark' ? '#cfc9bd' : 'var(--ink-2)',
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: '0.02em',
                ...style,
            }}
        >
            {children}
        </span>
    );
}
