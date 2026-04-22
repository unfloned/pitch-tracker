import { UnstyledButton } from '@mantine/core';
import { Label } from '../primitives/Label';

interface Props {
    label: string;
    value: string | number;
    sub?: string;
    onClick?: () => void;
}

/**
 * Paper surface with Label + serif numeric value. Click-through optional —
 * the "total" tile uses it to jump into Applications.
 */
export function StatTile({ label, value, sub, onClick }: Props) {
    const body = (
        <div
            style={{
                padding: 16,
                border: '1px solid var(--rule)',
                background: 'var(--card)',
                height: '100%',
            }}
        >
            <Label>{label}</Label>
            <div
                className="serif tnum"
                style={{
                    fontSize: 32,
                    fontWeight: 500,
                    color: 'var(--ink)',
                    letterSpacing: '-0.02em',
                    lineHeight: 1,
                    marginTop: 8,
                }}
            >
                {value}
            </div>
            {sub && (
                <div
                    className="mono"
                    style={{
                        fontSize: 10,
                        color: 'var(--ink-4)',
                        letterSpacing: '0.02em',
                        marginTop: 6,
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
            >
                {body}
            </UnstyledButton>
        );
    }
    return body;
}
