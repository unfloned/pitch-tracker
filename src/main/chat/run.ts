import type { BrowserWindow } from 'electron';
import { getLlmConfig } from '../llm';
import { newNonce } from '../llm/sanitize';
import { chatSystemPrompt } from './prompt';
import { CHAT_TOOLS, runTool } from './tools';

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string;
    tool_calls?: ToolCall[];
    name?: string;
}

interface ToolCall {
    id?: string;
    function: {
        name: string;
        arguments: Record<string, unknown> | string;
    };
}

interface OllamaChatResponse {
    message: {
        role: string;
        content: string;
        tool_calls?: ToolCall[];
    };
    done: boolean;
}

export interface ChatRequest {
    messages: ChatMessage[];
}

export interface ChatResponse {
    messages: ChatMessage[];
    reply: string;
    toolsUsed: string[];
    error?: string;
}

const MAX_TOOL_HOPS = 4;

export async function runChat(
    req: ChatRequest,
    win: BrowserWindow | null,
): Promise<ChatResponse> {
    const { ollamaUrl, ollamaModel } = getLlmConfig();
    const nonce = newNonce();
    const messages: ChatMessage[] = [
        { role: 'system', content: chatSystemPrompt(nonce) },
        ...req.messages,
    ];
    const toolsUsed: string[] = [];

    for (let hop = 0; hop < MAX_TOOL_HOPS; hop++) {
        const payload = {
            model: ollamaModel,
            messages,
            tools: CHAT_TOOLS,
            stream: false,
            options: { temperature: 0.3 },
        };

        let response: Response;
        try {
            response = await fetch(`${ollamaUrl}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(120000),
            });
        } catch (err) {
            return {
                messages,
                reply: '',
                toolsUsed,
                error: `Ollama nicht erreichbar: ${(err as Error).message}`,
            };
        }

        if (!response.ok) {
            const text = await response.text();
            return {
                messages,
                reply: '',
                toolsUsed,
                error: `Ollama HTTP ${response.status}: ${text.slice(0, 200)}`,
            };
        }

        const json = (await response.json()) as OllamaChatResponse;
        const msg = json.message;

        if (msg.tool_calls && msg.tool_calls.length > 0) {
            messages.push({
                role: 'assistant',
                content: msg.content ?? '',
                tool_calls: msg.tool_calls,
            });

            for (const call of msg.tool_calls) {
                const fnName = call.function.name;
                const fnArgs = call.function.arguments;
                toolsUsed.push(fnName);
                if (win && !win.isDestroyed()) {
                    win.webContents.send('chat:toolCall', { name: fnName, args: fnArgs });
                }
                const result = runTool(fnName, fnArgs);
                messages.push({
                    role: 'tool',
                    name: fnName,
                    content: JSON.stringify(result),
                });
            }
            continue;
        }

        messages.push({ role: 'assistant', content: msg.content ?? '' });
        return {
            messages,
            reply: msg.content ?? '',
            toolsUsed,
        };
    }

    return {
        messages,
        reply: '',
        toolsUsed,
        error: `Maximale Tool-Aufrufe (${MAX_TOOL_HOPS}) erreicht.`,
    };
}
