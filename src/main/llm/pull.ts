import type { LlmPullProgressPayload } from '@shared/events';
import { getLlmConfig } from './config';

/** Same shape as the renderer event payload, kept here to avoid main->shared
 *  import in client modules that only need the local type. */
export type PullProgress = LlmPullProgressPayload;

const activePulls = new Map<string, AbortController>();

/**
 * Abort an in-flight pull, if any. Returns true when a pull was aborted,
 * false when the model was not currently being pulled.
 */
export function cancelPull(modelName: string): boolean {
    const ctrl = activePulls.get(modelName);
    if (!ctrl) return false;
    ctrl.abort();
    activePulls.delete(modelName);
    return true;
}

interface OllamaPullEvent {
    status?: string;
    completed?: number;
    total?: number;
    error?: string;
}

/**
 * Pull a model from the Ollama library, streaming progress through the
 * supplied callback. The callback receives one event per JSON line emitted by
 * /api/pull. Ollama sends an event whenever the status changes (downloading
 * a layer, verifying, writing manifest, success, ...) and at high frequency
 * during the actual download. We forward each one verbatim and let the UI
 * decide which fields to show.
 *
 * Cancellation: tracked in `activePulls` so the renderer can abort an
 * in-flight pull via cancelPull(modelName). Aborting closes the stream and
 * returns { ok: false, message: 'aborted' }.
 */
export async function pullModel(
    modelName: string,
    onProgress?: (p: PullProgress) => void,
): Promise<{ ok: boolean; message?: string }> {
    const { ollamaUrl } = getLlmConfig();
    const controller = new AbortController();
    activePulls.set(modelName, controller);
    try {
        const response = await fetch(`${ollamaUrl}/api/pull`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: modelName, stream: true }),
            signal: controller.signal,
        });
        if (!response.ok) return { ok: false, message: `HTTP ${response.status}` };
        if (!response.body) return { ok: false, message: 'No response body' };

        const lastError = await consumePullStream(response.body, modelName, onProgress);
        if (lastError) return { ok: false, message: lastError };

        onProgress?.({
            model: modelName,
            status: 'success',
            completed: 0,
            total: 0,
            percent: 100,
            done: true,
        });
        return { ok: true };
    } catch (err) {
        if ((err as Error).name === 'AbortError') {
            return { ok: false, message: 'aborted' };
        }
        return { ok: false, message: (err as Error).message };
    } finally {
        activePulls.delete(modelName);
    }
}

/**
 * Read newline-delimited JSON from the pull stream and forward each event.
 * Returns the last error string the server emitted, if any. Lines that fail
 * to parse are silently dropped (Ollama occasionally sends keep-alive noise).
 */
async function consumePullStream(
    body: ReadableStream<Uint8Array>,
    modelName: string,
    onProgress?: (p: PullProgress) => void,
): Promise<string | undefined> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let lastError: string | undefined;

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            const evt = safeParse(trimmed);
            if (!evt) continue;
            if (evt.error) {
                lastError = evt.error;
                continue;
            }
            const total = evt.total ?? 0;
            const completed = evt.completed ?? 0;
            const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
            const isDone = (evt.status ?? '').toLowerCase() === 'success';
            onProgress?.({
                model: modelName,
                status: evt.status ?? '',
                completed,
                total,
                percent,
                done: isDone,
            });
        }
    }
    return lastError;
}

function safeParse(line: string): OllamaPullEvent | null {
    try {
        return JSON.parse(line) as OllamaPullEvent;
    } catch {
        return null;
    }
}
