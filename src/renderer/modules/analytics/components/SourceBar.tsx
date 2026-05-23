interface Props {
    src: string;
    apps: number;
    offers: number;
    maxApps: number;
}

/** One "where did applications come from" row. Ink bar = applied, moss overlay = offers. */
export function SourceBar({ src, apps, offers, maxApps }: Props) {
    const width = (apps / maxApps) * 100;
    const offWidth = apps > 0 && offers ? (offers / apps) * width : 0;
    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: '160px 1fr 48px 36px',
                gap: 10,
                alignItems: 'center',
                padding: '6px 0',
                borderBottom: '1px dashed var(--rule)',
            }}
        >
            <span
                className="mono"
                style={{ fontSize: 11, color: 'var(--ink-2)', letterSpacing: '0.02em' }}
            >
                {src}
            </span>
            <div style={{ height: 10, position: 'relative', background: 'var(--paper-3)' }}>
                <div style={{ height: '100%', width: `${width}%`, background: 'var(--ink-3)' }} />
                <div
                    style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        height: '100%',
                        width: `${offWidth}%`,
                        background: 'var(--moss)',
                    }}
                />
            </div>
            <span
                className="mono tnum"
                style={{ fontSize: 11, color: 'var(--ink-2)', textAlign: 'right' }}
            >
                {apps}
            </span>
            <span
                className="mono tnum"
                style={{
                    fontSize: 11,
                    color: offers ? 'var(--moss)' : 'var(--ink-4)',
                    fontWeight: offers ? 600 : 400,
                    textAlign: 'right',
                }}
            >
                {offers || '—'}
            </span>
        </div>
    );
}
