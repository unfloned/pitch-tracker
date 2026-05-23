interface Props {
    name: string;
}

/** Inline block rendered when the assistant called a tool mid-response. */
export function ToolCallBlock({ name }: Props) {
    return (
        <div
            style={{
                margin: '8px 0',
                border: '1px solid var(--rule)',
                background: 'var(--card)',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '6px 12px',
                    borderBottom: '1px solid var(--rule)',
                    background: 'var(--paper-2)',
                }}
            >
                <div
                    style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: 'var(--moss)',
                    }}
                />
                <span
                    className="mono"
                    style={{
                        fontSize: 10.5,
                        fontWeight: 600,
                        color: 'var(--ink-2)',
                        letterSpacing: '0.04em',
                    }}
                >
                    tool · {name}
                </span>
                <div style={{ flex: 1 }} />
                <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)' }}>
                    ok
                </span>
            </div>
        </div>
    );
}
