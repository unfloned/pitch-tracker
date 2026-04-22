import { ScrollArea, Textarea } from '@mantine/core';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GhostBtn } from '../components/primitives/GhostBtn';
import { Kbd } from '../components/primitives/Kbd';
import { Label } from '../components/primitives/Label';

const TOOLS = [
    { id: 'list_applications', name: 'List applications', desc: 'Filter by status' },
    { id: 'count_by_status',   name: 'Count by status',   desc: 'Tally per stage' },
    { id: 'stats',             name: 'Stats',             desc: 'Match avg, top companies' },
    { id: 'list_candidates',   name: 'List candidates',   desc: 'Agent leads, min score' },
    { id: 'search_applications', name: 'Search',          desc: 'Company/title/notes/tags' },
] as const;

interface Message {
    role: 'user' | 'assistant';
    content: string;
    toolsUsed?: string[];
    timestamp: Date;
}

const SUGGESTIONS_KEYS = [
    'chat.suggestion1',
    'chat.suggestion2',
    'chat.suggestion3',
    'chat.suggestion4',
];

function formatTime(d: Date): string {
    return d.toLocaleTimeString('de', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatDateHeader(d: Date): string {
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    return `${day} · ${months[d.getMonth()]} · ${d.getFullYear()}`;
}

function ToolCallBlock({ name }: { name: string }) {
    return (
        <div
            style={{
                margin: '8px 0',
                border: '1px solid var(--rule)',
                background: 'var(--card)',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '6px 12px',
                    borderBottom: '1px solid var(--rule)',
                    background: 'var(--paper-2)',
                }}
            >
                <div
                    style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: 'var(--moss)',
                    }}
                />
                <span
                    className="mono"
                    style={{
                        fontSize: 10.5,
                        fontWeight: 600,
                        color: 'var(--ink-2)',
                        letterSpacing: '0.04em',
                    }}
                >
                    tool · {name}
                </span>
                <div style={{ flex: 1 }} />
                <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)' }}>
                    ok
                </span>
            </div>
        </div>
    );
}

export function ChatPage() {
    const { t } = useTranslation();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [ollamaRunning, setOllamaRunning] = useState<boolean | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const threadStart = useRef(new Date());

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, sending]);

    useEffect(() => {
        const check = async () => {
            try {
                const s = await window.api.llm.status();
                setOllamaRunning(s.running);
            } catch {
                setOllamaRunning(false);
            }
        };
        check();
        const i = setInterval(check, 30000);
        return () => clearInterval(i);
    }, []);

    const send = async (text?: string) => {
        const prompt = (text ?? input).trim();
        if (!prompt || sending) return;
        setError(null);
        setInput('');
        const next: Message[] = [...messages, { role: 'user', content: prompt, timestamp: new Date() }];
        setMessages(next);
        setSending(true);

        const history = next.map((m) => ({ role: m.role, content: m.content }));
        const result = await window.api.chat.send({ messages: history });
        setSending(false);

        if (result.error) {
            setError(result.error);
            return;
        }
        setMessages((prev) => [
            ...prev,
            {
                role: 'assistant',
                content: result.reply,
                toolsUsed: result.toolsUsed,
                timestamp: new Date(),
            },
        ]);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            send();
        }
    };

    const clear = () => {
        setMessages([]);
        setError(null);
        threadStart.current = new Date();
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
            {/* toolbar */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 16px',
                    borderBottom: '1px solid var(--rule)',
                    flexShrink: 0,
                }}
            >
                <span
                    className="serif"
                    style={{
                        fontSize: 18,
                        fontWeight: 500,
                        color: 'var(--ink)',
                        letterSpacing: '-0.01em',
                    }}
                >
                    {t('chat.title')}
                </span>
                <span style={{ color: 'var(--ink-4)' }}>·</span>
                <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                    thread · {formatDateHeader(threadStart.current).toLowerCase()}
                </span>
                <div style={{ flex: 1 }} />
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '3px 8px',
                        border: '1px solid var(--rule)',
                        borderRadius: 4,
                        background: 'var(--card)',
                    }}
                >
                    <div
                        style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background:
                                ollamaRunning === null
                                    ? 'var(--ink-4)'
                                    : ollamaRunning
                                      ? 'var(--moss)'
                                      : 'var(--rust)',
                        }}
                    />
                    <span
                        className="mono"
                        style={{ fontSize: 10, color: 'var(--ink-2)', fontWeight: 500 }}
                    >
                        {ollamaRunning === null
                            ? 'checking'
                            : ollamaRunning
                              ? 'ollama · ready'
                              : 'ollama · offline'}
                    </span>
                </div>
                <GhostBtn>
                    <span>Tools</span>
                    <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>
                        {TOOLS.length} on
                    </span>
                </GhostBtn>
                {messages.length > 0 && (
                    <GhostBtn onClick={clear}>
                        <span>New thread</span>
                        <Kbd>⌘T</Kbd>
                    </GhostBtn>
                )}
            </div>

            {/* body: tools sidebar + thread */}
            <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
                {/* tools sidebar */}
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
                    {TOOLS.map((tool) => {
                        const usageCount = messages.reduce(
                            (n, m) =>
                                n + (m.toolsUsed?.includes(tool.id) ? 1 : 0),
                            0,
                        );
                        return (
                            <div
                                key={tool.id}
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
                                        {tool.name}
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
                                        {tool.id}
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
                    })}

                    <div style={{ flex: 1 }} />

                    <div
                        style={{
                            padding: 14,
                            borderTop: '1px solid var(--rule-strong)',
                        }}
                    >
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
                                Messages:{' '}
                                <span className="mono tnum">{messages.length}</span>
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
                                <span className="mono">
                                    {formatTime(threadStart.current)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* thread column */}
                <div
                    style={{
                        flex: 1,
                        minWidth: 0,
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <ScrollArea flex={1} viewportRef={scrollRef} style={{ background: 'var(--paper)' }}>
                <div style={{ padding: '24px 64px 16px', maxWidth: 820, margin: '0 auto' }}>
                    {/* marginalia header */}
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
                        <span>{formatDateHeader(threadStart.current)}</span>
                        <span>·</span>
                        <span>local session · unlogged</span>
                    </div>

                    {messages.length === 0 && (
                        <div style={{ marginBottom: 28 }}>
                            <Label>Suggestions</Label>
                            <div
                                style={{
                                    marginTop: 10,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 6,
                                }}
                            >
                                {SUGGESTIONS_KEYS.map((key) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => send(t(key))}
                                        style={{
                                            textAlign: 'left',
                                            padding: '10px 12px',
                                            border: '1px solid var(--rule)',
                                            background: 'var(--card)',
                                            borderRadius: 4,
                                            cursor: 'pointer',
                                            fontSize: 13.5,
                                            color: 'var(--ink-2)',
                                            fontFamily: 'var(--f-ui)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 10,
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'var(--paper-2)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'var(--card)';
                                        }}
                                    >
                                        <span style={{ color: 'var(--ink-4)' }}>↪</span>
                                        {t(key)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            style={{
                                marginBottom: 28,
                                paddingLeft: msg.role === 'assistant' ? 16 : 0,
                                borderLeft:
                                    msg.role === 'assistant'
                                        ? '2px solid var(--accent)'
                                        : 'none',
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
                                <Label color={msg.role === 'user' ? 'var(--ink)' : 'var(--accent-ink)'}>
                                    {msg.role === 'user' ? 'You' : 'Assistant'}
                                </Label>
                                <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)' }}>
                                    {formatTime(msg.timestamp)}
                                </span>
                            </div>
                            {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                                <div>
                                    {msg.toolsUsed.map((name, i) => (
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
                                {msg.content}
                            </div>
                        </div>
                    ))}

                    {sending && (
                        <div
                            style={{
                                marginBottom: 28,
                                paddingLeft: 16,
                                borderLeft: '2px solid var(--accent)',
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
                                <Label color="var(--accent-ink)">Assistant</Label>
                            </div>
                            <div
                                className="mono"
                                style={{ fontSize: 12, color: 'var(--ink-3)' }}
                            >
                                {t('chat.thinking')}
                                <span
                                    style={{
                                        borderLeft: '2px solid var(--ink)',
                                        marginLeft: 4,
                                        animation: 'blink 1s infinite',
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {error && (
                        <div
                            style={{
                                padding: 12,
                                border: '1px solid var(--rust)',
                                background: 'rgba(178, 78, 40, 0.08)',
                                fontSize: 12.5,
                                color: 'var(--rust)',
                                marginBottom: 16,
                            }}
                        >
                            <Label color="var(--rust)">Error</Label>
                            <div style={{ marginTop: 4 }}>{error}</div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* composer */}
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
                        value={input}
                        onChange={(e) => setInput(e.currentTarget.value)}
                        onKeyDown={handleKeyDown}
                        disabled={sending}
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
                            onClick={() => send()}
                            disabled={!input.trim() || sending}
                            style={{
                                border: 'none',
                                background: !input.trim() || sending ? 'var(--ink-3)' : 'var(--ink)',
                                color: 'var(--paper)',
                                padding: '6px 14px',
                                fontSize: 12,
                                fontWeight: 600,
                                borderRadius: 4,
                                cursor: !input.trim() || sending ? 'not-allowed' : 'pointer',
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
                </div>
            </div>
        </div>
    );
}
