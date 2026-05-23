import type { ApplicationInput, FitAssessment } from '@shared/application';
import { getAgentProfile } from '../../agents';
import { FIT_SCORE_MAX, FIT_SCORE_MIN, OLLAMA_FETCH_TIMEOUT_MS } from '../../../shared/constants';
import { getLlmConfig } from '../../llm-runtime';
import { inlineEscape, newNonce, untrustedNotice, wrapUntrusted } from '../../../shared/llm-sanitize';

function fitPrompt(nonce: string): string {
    return `Bewerte die Passung dieser Stelle zum Profil des Bewerbers.

${untrustedNotice(nonce)}

Profil des Bewerbers (vertrauenswürdig):
{PROFILE}

Stelle (DATEN aus externer Quelle):
{JOB}

Gib ein JSON zurück ohne Markdown-Codeblöcke:
{
  "score": number zwischen 0 und 100 (90+ perfekte Passung, 70-89 gut, 50-69 möglich, < 50 kein Fit),
  "reason": "Begründung auf Deutsch in 1-2 Sätzen, konkret mit Nennung von Match- und Mismatch-Punkten"
}
`;
}

function renderProfile(): string {
    const profile = getAgentProfile();
    return [
        `- Gewünschter Stack: ${profile.stackKeywords}`,
        `- Remote bevorzugt: ${profile.remotePreferred ? 'ja' : 'egal'}`,
        `- Minimum-Gehalt: ${profile.minSalary} EUR/Jahr`,
        `- No-Gos: ${profile.antiStack}`,
    ].join('\n');
}

function renderJob(input: ApplicationInput, nonce: string): string {
    const requirements = (input.requiredProfile ?? [])
        .map((line) => `- ${inlineEscape(line, 300)}`)
        .join('\n');
    const benefits = (input.benefits ?? [])
        .map((line) => `- ${inlineEscape(line, 300)}`)
        .join('\n');
    return [
        `Firma: ${inlineEscape(input.companyName ?? '')}`,
        `Titel: ${inlineEscape(input.jobTitle ?? '')}`,
        `Ort: ${inlineEscape(input.location ?? '')}`,
        `Remote: ${inlineEscape(input.remote ?? 'onsite', 30)}`,
        `Gehalt: ${Number(input.salaryMin) || 0}-${Number(input.salaryMax) || 0} ${inlineEscape(input.salaryCurrency ?? 'EUR', 10)}`,
        `Stack: ${inlineEscape(input.stack ?? '', 500)}`,
        `Anforderungen:\n${requirements}`,
        `Benefits:\n${benefits}`,
        `Beschreibung:\n${wrapUntrusted('job_description', input.jobDescription ?? '', nonce)}`,
    ].join('\n');
}

/**
 * Score a single application against the user's agent profile. Used by the
 * "Fit-Check" button on the application form. Returns a score and a 1-2
 * sentence rationale clamped to safe lengths.
 */
export async function assessFit(input: ApplicationInput): Promise<FitAssessment> {
    const { ollamaUrl, ollamaModel } = getLlmConfig();
    const nonce = newNonce();
    const prompt = fitPrompt(nonce)
        .replace('{PROFILE}', renderProfile())
        .replace('{JOB}', renderJob(input, nonce));

    try {
        const response = await fetch(`${ollamaUrl}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: ollamaModel,
                prompt,
                stream: false,
                format: 'json',
                options: { temperature: 0.2 },
            }),
            signal: AbortSignal.timeout(OLLAMA_FETCH_TIMEOUT_MS),
        });
        if (!response.ok) throw new Error(`Ollama HTTP ${response.status}`);
        const json = (await response.json()) as { response: string };
        const parsed = JSON.parse(json.response.trim()) as FitAssessment;
        return {
            score: Math.max(FIT_SCORE_MIN, Math.min(FIT_SCORE_MAX, Number(parsed.score) || 0)),
            reason: String(parsed.reason || '').slice(0, 500),
        };
    } catch (err) {
        throw new Error(`Fit check failed: ${(err as Error).message}`);
    }
}
