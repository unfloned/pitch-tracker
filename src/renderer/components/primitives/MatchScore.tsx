interface Props {
    value: number;
    width?: number;
    height?: number;
    /** Show the numeric value next to the bar. */
    showValue?: boolean;
}

/**
 * 8-cell bar chart glyph for match score 0-100.
 * Replaces RingProgress / percentage pills.
 */
export function MatchScore({ value, width = 40, height = 10, showValue = true }: Props) {
    const n = 8;
    const clamped = Math.max(0, Math.min(100, value));
    const filled = Math.round((clamped / 100) * n);
    const barColor =
        clamped >= 80 ? 'var(--moss)' : clamped >= 60 ? 'var(--accent)' : 'var(--ink-3)';

    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ display: 'flex', gap: 1.5, height, width }}>
                {Array.from({ length: n }).map((_, i) => (
                    <span
                        key={i}
                        style={{
                            flex: 1,
                            background: i < filled ? barColor : 'var(--paper-3)',
                        }}
                    />
                ))}
            </span>
            {showValue && (
                <span
                    className="mono tnum"
                    style={{ fontSize: 11, color: 'var(--ink-2)', fontWeight: 500 }}
                >
                    {clamped}
                </span>
            )}
        </span>
    );
}
