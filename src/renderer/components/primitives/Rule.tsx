import type { CSSProperties } from 'react';

interface Props {
    vertical?: boolean;
    color?: string;
    strong?: boolean;
    style?: CSSProperties;
}

/** 1px hairline divider. Paper aesthetic - never a shadow. */
export function Rule({ vertical = false, color, strong = false, style }: Props) {
    const resolved = color ?? (strong ? 'var(--rule-strong)' : 'var(--rule)');
    return (
        <div
            style={{
                background: resolved,
                width: vertical ? 1 : '100%',
                height: vertical ? '100%' : 1,
                flexShrink: 0,
                ...style,
            }}
        />
    );
}
