export function SectionHeader({ title, count }: { title: string; count?: number }) {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 14,
                marginBottom: 14,
                padding: '0 2px',
            }}
        >
            <div
                style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: 'var(--text-muted)',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                }}
            >
                {title}
            </div>
            {count !== undefined && count > 0 && (
                <span
                    className="mono"
                    style={{
                        fontSize: 11,
                        color: 'var(--text-faint)',
                        letterSpacing: '0.04em',
                    }}
                >
                    {count}
                </span>
            )}
            <div style={{ flex: 1, height: 1, background: 'var(--hairline)' }} />
        </div>
    );
}
