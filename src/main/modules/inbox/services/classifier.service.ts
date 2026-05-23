import type { ApplicationStatus } from '@shared/application';
import { getLlmConfig } from '../../llm-runtime';
import { newNonce } from '../../../shared/llm-sanitize';
import type { ApplicationRow } from '../../../db/types';
import { buildClassifierPrompt, type ClassifyInput } from './classifier-prompt.service';

export interface ClassifyOutput {
    applicationId: string | null;
    status: ApplicationStatus | 'other' | null;
    confidence: number;
    note: string;
    /** The full prompt that was sent to the LLM. Used for debug display. */
    prompt: string;
    /** The raw LLM response (before JSON parsing). Used for debug display. */
    rawResponse: string;
}

export async function classifyInboundEmail(
    input: ClassifyInput,
    activeApplications: ApplicationRow[],
): Promise<ClassifyOutput> {
    const { ollamaUrl, ollamaModel } = getLlmConfig();
    const nonce = newNonce();

    const fullPrompt = buildClassifierPrompt(input, activeApplications, nonce);

    try {
        const response = await fetch(`${ollamaUrl}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: ollamaModel,
                prompt: fullPrompt,
                stream: false,
                format: 'json',
                options: {
                    temperature: 0.1,
                    num_predict: 512,
                    num_ctx: 8192,
                },
            }),
            signal: AbortSignal.timeout(60000),
        });
        if (!response.ok) {
            return empty(`LLM-Fehler HTTP ${response.status}`, fullPrompt, '');
        }
        const json = (await response.json()) as { response: string };
        const raw = json.response.trim();
        return parseClassifierResponse(raw, activeApplications, fullPrompt);
    } catch (err) {
        return empty(`Ollama offline: ${(err as Error).message}`, fullPrompt, '');
    }
}

/**
 * Pure output-validation step. Exported so adversarial tests can assert
 * that a poisoned LLM response cannot smuggle a non-existent applicationId,
 * a bogus status or an out-of-range confidence past us.
 */
export function parseClassifierResponse(
    raw: string,
    apps: ApplicationRow[],
    prompt: string,
): ClassifyOutput {
    try {
        const parsed = JSON.parse(raw) as Partial<ClassifyOutput>;
        const validIds = new Set(apps.map((a) => a.id));
        const applicationId =
            typeof parsed.applicationId === 'string' && validIds.has(parsed.applicationId)
                ? parsed.applicationId
                : null;
        const status = normalizeStatus(parsed.status);
        const confidence = Math.max(
            0,
            Math.min(100, Number(parsed.confidence) || 0),
        );
        const note = typeof parsed.note === 'string' ? parsed.note.slice(0, 280) : '';
        return { applicationId, status, confidence, note, prompt, rawResponse: raw };
    } catch {
        return empty('LLM-Antwort ungültig', prompt, raw);
    }
}

function normalizeStatus(s: unknown): ApplicationStatus | 'other' | null {
    if (typeof s !== 'string') return null;
    const allowed: (ApplicationStatus | 'other')[] = [
        'rejected',
        'interview_scheduled',
        'interviewed',
        'offer_received',
        'in_review',
        'other',
    ];
    return (allowed as string[]).includes(s)
        ? (s as ApplicationStatus | 'other')
        : null;
}

function empty(note: string, prompt: string, rawResponse: string): ClassifyOutput {
    return {
        applicationId: null,
        status: null,
        confidence: 0,
        note,
        prompt,
        rawResponse,
    };
}
