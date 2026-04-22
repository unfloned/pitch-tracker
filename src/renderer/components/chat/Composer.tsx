import { Textarea } from '@mantine/core';
import type { KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Kbd } from '../primitives/Kbd';

interface Props {
    value: string;
    disabled: boolean;
    onChange: (value: string) => void;
    onSubmit: () => void;
}

/** Message composer at the bottom of the thread column. */
export function Composer({ value, disabled, onChange, onSubmit }: Props) {
    const { t } = useTranslation();

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            onSubmit();
        }
    };

    const disabledSend = !value.trim() || disabled;

    return (
        <div
            style={{
                padding: 14,
                borderTop: '1px solid var(--rule)',
                background: 'var(--paper-2)',
                flexShrink: 0,
            }}
        >
            <div
                style={{
                    maxWidth: 820,
                    margin: '0 auto',
                    border: '1px solid var(--rule-strong)',
                    background: 'var(--card)',
                    padding: '10px 12px',
                }}
            >
                <Textarea
                    placeholder={t('chat.placeholder')}
                    autosize
                    minRows={1}
                    maxRows={6}
                    value={value}
                    onChange={(e) => onChange(e.currentTarget.value)}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    variant="unstyled"
                    styles={{
                        input: {
                            fontFamily: 'var(--f-ui)',
                            fontSize: 14,
                            color: 'var(--ink)',
                            background: 'transparent',
                            minHeight: 40,
                        },
                    }}
                />
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        marginTop: 8,
                        paddingTop: 8,
                        borderTop: '1px dashed var(--rule)',
                    }}
                >
                    <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)' }}>
                        ⌘⏎ to send · shift⏎ for newline
                    </span>
                    <div style={{ flex: 1 }} />
                    <button
                        type="button"
                        onClick={onSubmit}
                        disabled={disabledSend}
                        style={{
                            border: 'none',
                            background: disabledSend ? 'var(--ink-3)' : 'var(--ink)',
                            color: 'var(--paper)',
                            padding: '6px 14px',
                            fontSize: 12,
                            fontWeight: 600,
                            borderRadius: 4,
                            cursor: disabledSend ? 'not-allowed' : 'pointer',
                            fontFamily: 'var(--f-ui)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                        }}
                    >
                        {t('chat.send')}
                        <Kbd tone="dark">⌘⏎</Kbd>
                    </button>
                </div>
            </div>
        </div>
    );
}
