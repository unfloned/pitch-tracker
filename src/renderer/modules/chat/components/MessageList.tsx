import { ScrollArea } from '@mantine/core';
import { forwardRef } from 'react';
import type { Message } from './types';
import { ErrorBanner } from './ErrorBanner';
import { MessageItem } from './MessageItem';
import { Suggestions } from './Suggestions';
import { ThinkingIndicator } from './ThinkingIndicator';
import { formatDateHeader } from './utils';

interface Props {
    messages: Message[];
    sending: boolean;
    error: string | null;
    threadStart: Date;
    onPickSuggestion: (prompt: string) => void;
}

/** Scrollable thread column with suggestions / messages / thinking / errors. */
export const MessageList = forwardRef<HTMLDivElement, Props>(function MessageList(
    { messages, sending, error, threadStart, onPickSuggestion },
    ref,
) {
    return (
        <ScrollArea flex={1} viewportRef={ref} style={{ background: 'var(--paper)' }}>
            <div style={{ padding: '24px 64px 16px', maxWidth: 820, margin: '0 auto' }}>
                <div
                    className="mono"
                    style={{
                        fontSize: 10,
                        color: 'var(--ink-4)',
                        letterSpacing: '0.1em',
                        marginBottom: 24,
                        display: 'flex',
                        gap: 14,
                    }}
                >
                    <span>{formatDateHeader(threadStart)}</span>
                    <span>·</span>
                    <span>local session · unlogged</span>
                </div>

                {messages.length === 0 && <Suggestions onPick={onPickSuggestion} />}

                {messages.map((msg, idx) => (
                    <MessageItem key={idx} message={msg} />
                ))}

                {sending && <ThinkingIndicator />}
                {error && <ErrorBanner message={error} />}
            </div>
        </ScrollArea>
    );
});
