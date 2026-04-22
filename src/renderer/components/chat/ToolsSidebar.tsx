import { Label } from '../primitives/Label';
import { TOOLS } from './constants';
import type { Message } from './types';
import { formatTime } from './utils';

interface Props {
    messages: Message[];
    ollamaRunning: boolean | null;
    threadStart: Date;
}

/** Left column of the chat layout: enabled tools with usage counters plus a small
 *  context summary at the bottom. */
export function ToolsSidebar({ messages, ollamaRunning, threadStart }: Props) {
    return (
        <div
            style={{
                width: 240,
                flexShrink: 0,
                background: 'var(--card)',
                borderRight: '1px solid var(--rule-strong)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'auto',
            }}
        >
            <div style={{ padding: '14px 14px 8px' }}>
                <Label>Enabled tools</Label>
            </div>
            {TOOLS.map((tool) => (
                <ToolRow
                    key={tool.id}
                    name={tool.name}
                    id={tool.id}
                    usageCount={messages.reduce(
                        (n, m) => n + (m.toolsUsed?.includes(tool.id) ? 1 : 0),
                        0,
                    )}
                />
            ))}

            <div style={{ flex: 1 }} />

            <div style={{ padding: 14, borderTop: '1px solid var(--rule-strong)' }}>
                <Label>Context</Label>
                <div
                    style={{
                        marginTop: 8,
                        fontSize: 11.5,
                        color: 'var(--ink-2)',
                        lineHeight: 1.5,
                    }}
                >
                    <div>
                        Messages: <span className="mono tnum">{messages.length}</span>
                    </div>
                    <div style={{ marginTop: 2 }}>
                        Ollama:{' '}
                        <span className="mono">
                            {ollamaRunning === null
                                ? 'checking'
                                : ollamaRunning
                                  ? 'ready'
                                  : 'offline'}
                        </span>
                    </div>
                    <div style={{ marginTop: 2 }}>
                        Thread start:{' '}
                        <span className="mono">{formatTime(threadStart)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ToolRow({
    name,
    id,
    usageCount,
}: {
    name: string;
    id: string;
    usageCount: number;
}) {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '7px 14px',
                borderBottom: '1px dashed var(--rule)',
            }}
        >
            <div
                style={{
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    background: 'var(--ink-2)',
                    border: '1px solid var(--ink-2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--paper)',
                    fontSize: 8,
                    flexShrink: 0,
                }}
            >
                ✓
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div
                    style={{
                        fontSize: 12,
                        color: 'var(--ink)',
                        fontWeight: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {name}
                </div>
                <div
                    className="mono"
                    style={{
                        fontSize: 10,
                        color: 'var(--ink-4)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {id}
                </div>
            </div>
            <span
                className="mono"
                style={{
                    fontSize: 9,
                    color: usageCount > 0 ? 'var(--accent-ink)' : 'var(--ink-4)',
                }}
            >
                {usageCount > 0 ? `${usageCount}×` : 'idle'}
            </span>
        </div>
    );
}
