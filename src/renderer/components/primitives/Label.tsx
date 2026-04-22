import type { CSSProperties, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    color?: string;
    size?: number;
    style?: CSSProperties;
}

/** ALL-CAPS mono label with tracking. The voice of the system. */
export function Label({ children, color = 'var(--ink-4)', size = 10, style }: Props) {
    return (
        <span
            className="mono"
            style={{
                fontSize: size,
                fontWeight: 500,
                color,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                ...style,
            }}
        >
            {children}
        </span>
    );
}
