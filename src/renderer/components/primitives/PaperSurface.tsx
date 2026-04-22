import type { CSSProperties, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    style?: CSSProperties;
    /** Add faint ruled lines — journal/notes feel. */
    ruled?: boolean;
}

/** Card/paper surface with optional ruled lines. */
export function PaperSurface({ children, style, ruled = false }: Props) {
    return (
        <div
            style={{
                background: 'var(--card)',
                border: '1px solid var(--rule)',
                ...(ruled && {
                    backgroundImage:
                        'repeating-linear-gradient(0deg, transparent 0, transparent 23px, rgba(0,0,0,0.04) 23px, rgba(0,0,0,0.04) 24px)',
                    backgroundPosition: '0 6px',
                }),
                ...style,
            }}
        >
            {children}
        </div>
    );
}
