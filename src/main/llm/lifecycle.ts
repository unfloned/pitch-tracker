import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import {
    OLLAMA_START_POLL_APP_ATTEMPTS,
    OLLAMA_START_POLL_CLI_ATTEMPTS,
    OLLAMA_START_POLL_MS,
} from '../constants';
import { checkLlmStatus, getLlmConfig } from './config';

const OLLAMA_CLI_CANDIDATES = [
    '/opt/homebrew/bin/ollama',
    '/usr/local/bin/ollama',
    '/usr/bin/ollama',
];

function findOllamaCli(): string | null {
    for (const path of OLLAMA_CLI_CANDIDATES) {
        if (existsSync(path)) return path;
    }
    return null;
}

export interface StartResult {
    started: boolean;
    method: 'app' | 'cli' | 'already-running' | 'none';
    message?: string;
}

/**
 * Start Ollama on macOS. Prefers the desktop app at /Applications/Ollama.app
 * when present; falls back to `ollama serve` via the Homebrew CLI. Polls the
 * status endpoint until it responds or we hit the configured attempt cap.
 *
 * On Linux/Windows the desktop check fails and we go straight to the CLI.
 */
export async function startOllama(): Promise<StartResult> {
    const pre = await checkLlmStatus();
    if (pre.running) return { started: true, method: 'already-running' };

    if (existsSync('/Applications/Ollama.app')) {
        spawn('open', ['-a', 'Ollama'], { detached: true, stdio: 'ignore' }).unref();
        for (let i = 0; i < OLLAMA_START_POLL_APP_ATTEMPTS; i++) {
            await new Promise((r) => setTimeout(r, OLLAMA_START_POLL_MS));
            const status = await checkLlmStatus();
            if (status.running) return { started: true, method: 'app' };
        }
        return {
            started: false,
            method: 'app',
            message: `Ollama app launched but did not respond within ${OLLAMA_START_POLL_APP_ATTEMPTS}s.`,
        };
    }

    const cli = findOllamaCli();
    if (!cli) {
        return {
            started: false,
            method: 'none',
            message:
                'Ollama not found. Install via `brew install ollama` or the desktop app from https://ollama.com/download.',
        };
    }

    spawn(cli, ['serve'], { detached: true, stdio: 'ignore' }).unref();
    for (let i = 0; i < OLLAMA_START_POLL_CLI_ATTEMPTS; i++) {
        await new Promise((r) => setTimeout(r, OLLAMA_START_POLL_MS));
        const status = await checkLlmStatus();
        if (status.running) return { started: true, method: 'cli' };
    }
    return {
        started: false,
        method: 'cli',
        message: `\`ollama serve\` launched but did not respond within ${OLLAMA_START_POLL_CLI_ATTEMPTS}s.`,
    };
}

/**
 * Tell Ollama to unload the active model from memory. Used after agent runs
 * so VRAM/RAM frees up between sporadic uses.
 */
export async function unloadModel(): Promise<{ ok: boolean }> {
    const { ollamaUrl, ollamaModel } = getLlmConfig();
    try {
        await fetch(`${ollamaUrl}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: ollamaModel, keep_alive: 0, prompt: '' }),
            signal: AbortSignal.timeout(5000),
        });
        return { ok: true };
    } catch {
        return { ok: false };
    }
}
