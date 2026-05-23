interface Props {
    label: string;
    n: number;
    total: number;
    peak?: boolean;
}

/** Single row inside the funnel chart: label · bar · count · percent. */
export function FunnelStep({ label, n, total, peak }: Props) {
    const pct = total > 0 ? (n / total) * 100 : 0;
    const width = Math.max(1.5, Math.min(100, pct));
    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: '110px 1fr 60px 50px',
                gap: 10,
                alignItems: 'center',
                padding: '7px 0',
            }}
        >
            <span style={{ fontSize: 12.5, color: 'var(--ink-2)', fontWeight: 500 }}>
                {label}
            </span>
            <div style={{ height: 18, background: 'var(--paper-3)', position: 'relative' }}>
                <div
                    style={{
                        height: '100%',
                        width: `${width}%`,
                        background: peak ? 'var(--accent)' : 'var(--ink-2)',
                    }}
                />
            </div>
            <span
                className="mono tnum"
                style={{
                    fontSize: 12,
                    color: 'var(--ink-2)',
                    fontWeight: 500,
                    textAlign: 'right',
                }}
            >
                {n}
            </span>
            <span
                className="mono tnum"
                style={{ fontSize: 10.5, color: 'var(--ink-4)', textAlign: 'right' }}
            >
                {pct.toFixed(1)}%
            </span>
        </div>
    );
}
