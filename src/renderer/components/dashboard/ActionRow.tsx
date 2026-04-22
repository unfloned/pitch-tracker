import { UnstyledButton } from '@mantine/core';
import { IconArrowRight } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import type { ApplicationStatus } from '@shared/application';
import { StageGlyph } from '../primitives/StageGlyph';

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
 * Dense, paper-styled action line with a leading glyph or mono tag, title +
 * subtitle, a colored status pill on the right, and a chevron. Shared between
 * every Today-list entry (offers, interviews, follow-ups, candidates).
 */
export function ActionRow({ tag, title, subtitle, rightLabel, rightTone, status, onClick }: Props) {
    const rightBg =
        rightTone === 'moss'
            ? 'var(--moss)'
            : rightTone === 'rust'
              ? 'var(--rust)'
              : rightTone === 'accent'
                ? 'var(--accent)'
                : rightTone === 'ink'
                  ? 'var(--ink)'
                  : 'var(--paper-2)';
    const rightColor = rightTone ? 'var(--paper)' : 'var(--ink-2)';

    return (
        <UnstyledButton
            onClick={onClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                width: '100%',
                borderBottom: '1px solid var(--rule)',
                background: 'transparent',
                transition: 'background 80ms',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--paper-2)';
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
                        width: 22,
                        height: 22,
                        flexShrink: 0,
                        background: 'var(--card)',
                        border: '1px solid var(--rule-strong)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--ink-2)',
                    }}
                >
                    {tag}
                </div>
            )}
            <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <div
                    style={{
                        fontSize: 13,
                        color: 'var(--ink)',
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
                            fontSize: 11,
                            color: 'var(--ink-3)',
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
                        padding: '2px 6px',
                        background: rightBg,
                        color: rightColor,
                        letterSpacing: '0.02em',
                        flexShrink: 0,
                    }}
                >
                    {rightLabel}
                </span>
            )}
            <IconArrowRight size={12} style={{ color: 'var(--ink-4)', flexShrink: 0 }} />
        </UnstyledButton>
    );
}
