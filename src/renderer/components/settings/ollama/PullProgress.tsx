import type { PullProgressEvent } from '../../../../preload/index';
import { formatBytes } from './format';

/**
 * Inline progress under a pulling model: status label + bytes/percent +
 * progress bar. Falls back to an indeterminate pulse when Ollama hasn't yet
 * reported a total (manifest phase).
 */
export function PullProgress({ progress }: { progress: PullProgressEvent }) {
    const showBar = progress.total > 0;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 10.5,
                    color: 'var(--ink-3)',
                }}
            >
                <span
                    className="mono"
                    style={{
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        color: 'var(--ink-2)',
                    }}
                >
                    {progress.status || 'pulling'}
                </span>
                {showBar && (
                    <span className="mono tnum" style={{ color: 'var(--ink-2)' }}>
                        {progress.percent}% · {formatBytes(progress.completed)} /{' '}
                        {formatBytes(progress.total)}
                    </span>
                )}
            </div>
            <div
                style={{
                    height: 3,
                    background: 'var(--paper-3)',
                    overflow: 'hidden',
                }}
            >
                <div
                    style={{
                        width: showBar ? `${progress.percent}%` : '30%',
                        height: '100%',
                        background: 'var(--accent)',
                        transition: 'width 250ms',
                        animation: showBar ? 'none' : 'pulse-pull 1.4s ease-in-out infinite',
                    }}
                />
            </div>
        </div>
    );
}
