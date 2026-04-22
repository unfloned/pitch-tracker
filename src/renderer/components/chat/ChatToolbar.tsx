import { useTranslation } from 'react-i18next';
import { GhostBtn } from '../primitives/GhostBtn';
import { Kbd } from '../primitives/Kbd';
import { TOOLS } from './constants';
import { formatDateHeader } from './utils';

interface Props {
    threadStart: Date;
    ollamaRunning: boolean | null;
    hasMessages: boolean;
    onClear: () => void;
}

export function ChatToolbar({ threadStart, ollamaRunning, hasMessages, onClear }: Props) {
    const { t } = useTranslation();
    return (
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
                thread · {formatDateHeader(threadStart).toLowerCase()}
            </span>
            <div style={{ flex: 1 }} />
            <OllamaBadge running={ollamaRunning} />
            <GhostBtn>
                <span>Tools</span>
                <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>
                    {TOOLS.length} on
                </span>
            </GhostBtn>
            {hasMessages && (
                <GhostBtn onClick={onClear}>
                    <span>New thread</span>
                    <Kbd>⌘T</Kbd>
                </GhostBtn>
            )}
        </div>
    );
}

function OllamaBadge({ running }: { running: boolean | null }) {
    const color =
        running === null ? 'var(--ink-4)' : running ? 'var(--moss)' : 'var(--rust)';
    const text =
        running === null ? 'checking' : running ? 'ollama · ready' : 'ollama · offline';
    return (
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
                    background: color,
                }}
            />
            <span
                className="mono"
                style={{ fontSize: 10, color: 'var(--ink-2)', fontWeight: 500 }}
            >
                {text}
            </span>
        </div>
    );
}
