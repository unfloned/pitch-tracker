import { UnstyledButton } from '@mantine/core';

interface Props {
    label: string;
    value: string | number;
    sub?: string;
    onClick?: () => void;
}

/**
 * v2 stat tile: surface with soft shadow, no border. Click-through optional.
 */
export function StatTile({ label, value, sub, onClick }: Props) {
    const body = (
        <div
            style={{
                padding: '18px 20px 20px',
                background: 'var(--surface)',
                borderRadius: 10,
                boxShadow: 'var(--shadow-sm)',
                height: '100%',
                transition: 'background 120ms, transform 120ms, box-shadow 120ms',
            }}
        >
            <div
                style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: 'var(--text-faint)',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    marginBottom: 10,
                }}
            >
                {label}
            </div>
            <div
                className="tnum"
                style={{
                    fontFamily: 'var(--f-ui)',
                    fontSize: 30,
                    fontWeight: 600,
                    color: 'var(--text)',
                    letterSpacing: '-0.025em',
                    lineHeight: 1,
                }}
            >
                {value}
            </div>
            {sub && (
                <div
                    className="mono"
                    style={{
                        fontSize: 10.5,
                        color: 'var(--text-faint)',
                        letterSpacing: '0.02em',
                        marginTop: 8,
                    }}
                >
                    {sub}
                </div>
            )}
        </div>
    );

    if (onClick) {
        return (
            <UnstyledButton
                onClick={onClick}
                style={{ width: '100%', textAlign: 'left', height: '100%' }}
                styles={{
                    root: {
                        borderRadius: 10,
                    },
                }}
            >
                {body}
            </UnstyledButton>
        );
    }
    return body;
}
