import { notifications } from '@mantine/notifications';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { PullProgressEvent } from '../../../../preload/index';

export interface OllamaStatus {
    running: boolean;
    models: string[];
    error?: string;
}

export interface UseOllama {
    /** Live status from `/api/tags`. null while the first probe is in flight. */
    status: OllamaStatus | null;
    /** Set of installed model names. Memoised view of `status.models`. */
    installed: Set<string>;
    /** URL the user has saved as the Ollama endpoint. */
    ollamaUrl: string;
    setOllamaUrl: (url: string) => void;
    /** Currently configured default model (used by scoring/extraction/etc). */
    activeModel: string;
    /** Active pulls keyed by model name. */
    progress: Record<string, PullProgressEvent>;

    starting: boolean;
    savingUrl: boolean;

    refreshStatus: () => Promise<void>;
    startServer: () => Promise<void>;
    saveUrl: () => Promise<void>;
    setActive: (model: string) => Promise<void>;
    pull: (model: string) => Promise<void>;
    cancel: (model: string) => Promise<void>;
    /** Surface the manual `ollama rm` command - Ollama doesn't expose delete via /api yet. */
    remindRemove: (model: string) => void;
}

/**
 * One-stop hook for the Ollama settings card. Owns config + status + active
 * pulls so the UI components can stay dumb. Subscribes to the live
 * `llm:pullProgress` stream so multiple concurrent pulls each get live
 * updates per row.
 */
export function useOllama(): UseOllama {
    const { t } = useTranslation();
    const [ollamaUrl, setOllamaUrlState] = useState('http://localhost:11434');
    const [activeModel, setActiveModel] = useState('llama3.2:3b');
    const [status, setStatus] = useState<OllamaStatus | null>(null);
    const [starting, setStarting] = useState(false);
    const [savingUrl, setSavingUrl] = useState(false);
    const [progress, setProgress] = useState<Record<string, PullProgressEvent>>({});

    const refreshStatus = useCallback(async () => {
        const s = await window.api.llm.status();
        setStatus(s);
    }, []);

    useEffect(() => {
        window.api.llm.getConfig().then((c) => {
            setOllamaUrlState(c.ollamaUrl);
            setActiveModel(c.ollamaModel);
        });
        refreshStatus();
        const off = window.api.on('llm:pullProgress', (p) => {
            setProgress((prev) => ({ ...prev, [p.model]: p }));
        });
        return () => {
            off();
        };
    }, [refreshStatus]);

    const installed = useMemo(() => new Set(status?.models ?? []), [status]);

    const startServer = useCallback(async () => {
        setStarting(true);
        const result = await window.api.llm.start();
        setStarting(false);
        await refreshStatus();
        if (result.started) {
            const method =
                result.method === 'already-running'
                    ? t('settings.ollamaAlreadyRunning')
                    : result.method === 'app'
                      ? t('settings.ollamaStartedApp')
                      : t('settings.ollamaStartedCli');
            notifications.show({
                color: 'green',
                message: t('settings.ollamaStartedRunning', { method }),
            });
        } else {
            notifications.show({
                color: 'red',
                title: t('settings.ollamaStartFailed'),
                message: result.message ?? 'Unknown error',
                autoClose: 10000,
            });
        }
    }, [refreshStatus, t]);

    const saveUrl = useCallback(async () => {
        setSavingUrl(true);
        await window.api.llm.setConfig({ ollamaUrl });
        setSavingUrl(false);
        notifications.show({ color: 'green', message: t('settings.settingsSaved') });
        await refreshStatus();
    }, [ollamaUrl, refreshStatus, t]);

    const setActive = useCallback(
        async (name: string) => {
            setActiveModel(name);
            await window.api.llm.setConfig({ ollamaModel: name });
            notifications.show({
                color: 'green',
                message: t('settings.modelActivated', { model: name }),
            });
        },
        [t],
    );

    const pull = useCallback(
        async (name: string) => {
            setProgress((prev) => ({
                ...prev,
                [name]: {
                    model: name,
                    status: 'starting',
                    completed: 0,
                    total: 0,
                    percent: 0,
                    done: false,
                },
            }));
            const result = await window.api.llm.pullModel(name);
            setProgress((prev) => {
                const next = { ...prev };
                delete next[name];
                return next;
            });
            if (result.ok) {
                notifications.show({
                    color: 'green',
                    message: t('settings.modelDownloaded', { model: name }),
                });
                await refreshStatus();
            } else if (result.message === 'aborted') {
                notifications.show({
                    color: 'gray',
                    message: t('settings.downloadCanceled', 'Download abgebrochen'),
                });
            } else {
                notifications.show({
                    color: 'red',
                    title: t('settings.downloadFailed'),
                    message: result.message ?? 'Unknown error',
                    autoClose: 10000,
                });
            }
        },
        [refreshStatus, t],
    );

    const cancel = useCallback(async (name: string) => {
        await window.api.llm.cancelPull(name);
    }, []);

    const remindRemove = useCallback(
        (name: string) => {
            notifications.show({
                color: 'gray',
                title: t('settings.removeModelTitle', 'Modell entfernen'),
                message: t('settings.removeModelHint', {
                    cmd: `ollama rm ${name}`,
                    defaultValue: `Bitte im Terminal ausführen: \`{{cmd}}\``,
                }),
                autoClose: 8000,
            });
        },
        [t],
    );

    return {
        status,
        installed,
        ollamaUrl,
        setOllamaUrl: setOllamaUrlState,
        activeModel,
        progress,
        starting,
        savingUrl,
        refreshStatus,
        startServer,
        saveUrl,
        setActive,
        pull,
        cancel,
        remindRemove,
    };
}
