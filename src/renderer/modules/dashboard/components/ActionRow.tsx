import { UnstyledButton } from '@mantine/core';
import { IconArrowRight } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import type { ApplicationStatus } from '@shared/application';
import { StageGlyph } from '../../../components/primitives/StageGlyph';

export type ActionTone = 'accent' | 'moss' | 'rust' | 'ink';

interface Props {
    tag?: ReactNode;
    title: string;
    subtitle?: string;
    rightLabel?: string;
    rightTone?: ActionTone;
    status?: ApplicationStatus;
    onClick: () => void;
}

/**
 * v2 action line: soft hover, no borders. Leading glyph or icon-tag,
 * title + subtitle, soft tinted pill on the right, chevron.
 */
export function ActionRow({ tag, title, subtitle, rightLabel, rightTone, status, onClick }: Props) {
    const toneBg =
        rightTone === 'moss'
            ? 'var(--success-soft)'
            : rightTone === 'rust'
              ? 'var(--danger-soft)'
              : rightTone === 'accent'
                ? 'var(--accent-soft)'
                : rightTone === 'ink'
                  ? 'var(--surface-3)'
                  : 'var(--surface-2)';
    const toneFg =
        rightTone === 'moss'
            ? 'var(--success)'
            : rightTone === 'rust'
              ? 'var(--danger)'
              : rightTone === 'accent'
                ? 'var(--accent)'
                : 'var(--text)';

    return (
        <UnstyledButton
            onClick={onClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                width: '100%',
                borderRadius: 8,
                background: 'transparent',
                transition: 'background 100ms',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--surface-2)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
            }}
        >
            {status ? (
                <div style={{ flexShrink: 0 }}>
                    <StageGlyph status={status} size={11} />
                </div>
            ) : (
                <div
                    style={{
                        width: 24,
                        height: 24,
                        flexShrink: 0,
                        background: 'var(--surface-2)',
                        borderRadius: 6,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-muted)',
                    }}
                >
                    {tag}
                </div>
            )}
            <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <div
                    style={{
                        fontSize: 13.5,
                        color: 'var(--text)',
                        fontWeight: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {title}
                </div>
                {subtitle && (
                    <div
                        style={{
                            fontSize: 12,
                            color: 'var(--text-muted)',
                            marginTop: 2,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {subtitle}
                    </div>
                )}
            </div>
            {rightLabel && (
                <span
                    className="mono"
                    style={{
                        fontSize: 10.5,
                        fontWeight: 600,
                        padding: '3px 8px',
                        background: toneBg,
                        color: toneFg,
                        letterSpacing: '0.04em',
                        borderRadius: 5,
                        flexShrink: 0,
                        textTransform: 'uppercase',
                    }}
                >
                    {rightLabel}
                </span>
            )}
            <IconArrowRight size={13} style={{ color: 'var(--text-faint)', flexShrink: 0 }} />
        </UnstyledButton>
    );
}
