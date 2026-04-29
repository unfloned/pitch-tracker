import { Label } from '../primitives/Label';

export type Tone = 'accent' | 'moss' | 'rust';

interface Props {
    label: string;
    value: string | number;
    sub?: string;
    tone?: Tone;
    unit?: string;
}

/** Single KPI tile used in the top strip - Label, big serif number, colored sub. */
export function KPI({ label, value, sub, tone, unit }: Props) {
    const subBg =
        tone === 'moss'
            ? 'var(--moss)'
            : tone === 'rust'
              ? 'var(--rust)'
              : tone === 'accent'
                ? 'var(--accent-ink)'
                : 'var(--paper-2)';
    const subColor = tone ? 'var(--paper)' : 'var(--ink-2)';

    return (
        <div style={{ padding: '18px 18px', borderRight: '1px solid var(--rule)' }}>
            <Label>{label}</Label>
            <div
                className="serif tnum"
                style={{
                    fontSize: 42,
                    fontWeight: 500,
                    color: 'var(--ink)',
                    letterSpacing: '-0.02em',
                    lineHeight: 1,
                    marginTop: 10,
                }}
            >
                {value}
                {unit && (
                    <span style={{ fontSize: 20, color: 'var(--ink-3)', marginLeft: 4 }}>
                        {unit}
                    </span>
                )}
            </div>
            {sub && (
                <div style={{ marginTop: 8 }}>
                    <span
                        className="mono"
                        style={{
                            padding: '1px 5px',
                            fontSize: 10,
                            fontWeight: 600,
                            background: subBg,
                            color: subColor,
                        }}
                    >
                        {sub}
                    </span>
                </div>
            )}
        </div>
    );
}
