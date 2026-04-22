import { Label } from '../primitives/Label';
import { ToolCallBlock } from './ToolCallBlock';
import type { Message } from './types';
import { formatTime } from './utils';

interface Props {
    message: Message;
}

export function MessageItem({ message }: Props) {
    const isAssistant = message.role === 'assistant';
    return (
        <div
            style={{
                marginBottom: 28,
                paddingLeft: isAssistant ? 16 : 0,
                borderLeft: isAssistant ? '2px solid var(--accent)' : 'none',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 10,
                    marginBottom: 6,
                }}
            >
                <Label color={isAssistant ? 'var(--accent-ink)' : 'var(--ink)'}>
                    {isAssistant ? 'Assistant' : 'You'}
                </Label>
                <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)' }}>
                    {formatTime(message.timestamp)}
                </span>
            </div>
            {message.toolsUsed && message.toolsUsed.length > 0 && (
                <div>
                    {message.toolsUsed.map((name, i) => (
                        <ToolCallBlock key={i} name={name} />
                    ))}
                </div>
            )}
            <div
                style={{
                    fontSize: 14.5,
                    color: 'var(--ink)',
                    lineHeight: 1.55,
                    whiteSpace: 'pre-wrap',
                }}
            >
                {message.content}
            </div>
        </div>
    );
}
