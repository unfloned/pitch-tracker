import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface RunProgress {
    searchId: string;
    searchLabel: string;
    source: string;
    current: number;
    total: number;
    phase: 'fetching' | 'scoring' | 'done';
}

interface Props {
    totalApplications: number;
    visibleApplications: number;
}

/**
 * Text-editor style status bar. 24-28px, JetBrains Mono, hairline top,
 * paper-2 background. Left: scope + data-dir. Right: agent/ollama state.
 */
export function StatusFooter({ totalApplications, visibleApplications }: Props) {
    const { t } = useTranslation();
    const [progress, setProgress] = useState<RunProgress | null>(null);
    const [ollamaRunning, setOllamaRunning] = useState<boolean | null>(null);
    const labelsRef = useRef<Record<string, string>>({});

    useEffect(() => {
        const loadLabels = () => {
            window.api.agents.listSearches().then((searches) => {
                const map: Record<string, string> = {};
                for (const s of searches) map[s.id] = s.label;
                labelsRef.current = map;
            });
        };
        loadLabels();

        const offStart = window.api.on('agents:runStarted', (payload: { searchId: string }) => {
            loadLabels();
            setProgress({
                searchId: payload.searchId,
                searchLabel: labelsRef.current[payload.searchId] ?? 'Search',
                source: '',
                current: 0,
                total: 0,
                phase: 'fetching',
            });
        });

        const offProgress = window.api.on(
            'agents:runProgress',
            (payload: Omit<RunProgress, 'searchLabel'>) => {
                setProgress((prev) => ({
                    ...payload,
                    searchLabel:
                        prev?.searchLabel ?? labelsRef.current[payload.searchId] ?? 'Search',
                }));
            },
        );

        const offFinished = window.api.on('agents:runFinished', () => {
            setTimeout(() => setProgress(null), 1500);
        });

        const checkOllama = async () => {
            try {
                const status = await window.api.llm.status();
                setOllamaRunning(status.running);
            } catch {
                setOllamaRunning(false);
            }
        };
        checkOllama();
        const interval = setInterval(checkOllama, 30000);

        return () => {
            offStart();
            offProgress();
            offFinished();
            clearInterval(interval);
        };
    }, []);

    const visibleText =
        visibleApplications === totalApplications
            ? t('footer.applications', { count: totalApplications })
            : t('footer.showing', { visible: visibleApplications, total: totalApplications });

    return (
        <div
            className="mono"
            style={{
                height: '100%',
                padding: '0 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                fontSize: 10.5,
                color: 'var(--ink-3)',
                letterSpacing: '0.02em',
            }}
        >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                    style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: progress ? 'var(--accent)' : 'var(--moss)',
                    }}
                />
                <span>{progress ? t('footer.working') : 'local · idle'}</span>
            </span>

            <span style={{ color: 'var(--ink-4)' }}>·</span>

            <span>{visibleText}</span>

            {progress && (
                <>
                    <span style={{ color: 'var(--ink-4)' }}>·</span>
                    <span style={{ color: 'var(--ink-2)', fontWeight: 600 }}>
                        {progress.searchLabel}
                    </span>
                    {progress.source && (
                        <>
                            <span style={{ color: 'var(--ink-4)' }}>·</span>
                            <span>{progress.source}</span>
                        </>
                    )}
                    {progress.total > 0 && (
                        <>
                            <span style={{ color: 'var(--ink-4)' }}>·</span>
                            <span className="tnum">
                                {progress.current}/{progress.total} · {progress.phase}
                            </span>
                        </>
                    )}
                </>
            )}

            <div style={{ flex: 1 }} />

            <span
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    color:
                        ollamaRunning === null
                            ? 'var(--ink-4)'
                            : ollamaRunning
                              ? 'var(--ink-2)'
                              : 'var(--rust)',
                }}
                title={
                    ollamaRunning === null
                        ? t('footer.ollamaChecking')
                        : ollamaRunning
                          ? t('footer.ollamaRunning')
                          : t('footer.ollamaOffline')
                }
            >
                <span
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
                <span style={{ letterSpacing: '0.06em', fontWeight: 600 }}>
                    OLLAMA · {ollamaRunning === null ? '...' : ollamaRunning ? 'READY' : 'OFFLINE'}
                </span>
            </span>

            <span style={{ color: 'var(--ink-4)' }}>·</span>
            <span>autosaved · just now</span>
        </div>
    );
}
