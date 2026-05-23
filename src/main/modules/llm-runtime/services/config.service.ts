import Store from 'electron-store';

export interface LlmConfig {
    ollamaUrl: string;
    ollamaModel: string;
}

const configStore = new Store<LlmConfig>({
    defaults: {
        ollamaUrl: 'http://localhost:11434',
        ollamaModel: 'llama3.2:3b',
    },
});

export function getLlmConfig(): LlmConfig {
    return {
        ollamaUrl: configStore.get('ollamaUrl'),
        ollamaModel: configStore.get('ollamaModel'),
    };
}

export function setLlmConfig(config: Partial<LlmConfig>): void {
    if (config.ollamaUrl !== undefined) configStore.set('ollamaUrl', config.ollamaUrl);
    if (config.ollamaModel !== undefined) configStore.set('ollamaModel', config.ollamaModel);
}

export interface LlmStatus {
    running: boolean;
    models: string[];
    error?: string;
}

/**
 * Probe Ollama via /api/tags. Short timeout (2s) so the UI can poll the
 * status without blocking. Returns running=false on any network failure.
 */
export async function checkLlmStatus(): Promise<LlmStatus> {
    const { ollamaUrl } = getLlmConfig();
    try {
        const response = await fetch(`${ollamaUrl}/api/tags`, {
            signal: AbortSignal.timeout(2000),
        });
        if (!response.ok) {
            return { running: false, models: [], error: `HTTP ${response.status}` };
        }
        const json = (await response.json()) as { models?: { name: string }[] };
        return { running: true, models: (json.models ?? []).map((m) => m.name) };
    } catch (err) {
        return { running: false, models: [], error: (err as Error).message };
    }
}
