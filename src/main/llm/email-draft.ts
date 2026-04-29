import type { ApplicationInput } from '@shared/application';
import { OLLAMA_FETCH_TIMEOUT_MS } from '../constants';
import { getUserProfile } from '../profile';
import { getLlmConfig } from './config';

export interface EmailDraft {
    subject: string;
    body: string;
}

const DEFAULT_INSTRUCTION =
    'Ton: professionell, warm, kurz. Max. 4 Sätze im Hauptteil. Keine Buzzwords.';

function buildPrompt(input: ApplicationInput): string {
    const profile = getUserProfile();
    const instruction = profile.emailInstruction.trim() || DEFAULT_INSTRUCTION;
    const contactLine = input.contactName
        ? `Persönliche Anrede an ${input.contactName}`
        : 'Anrede: "Sehr geehrte Damen und Herren" (kein Name bekannt)';

    return `Du entwirfst eine Bewerbungs-E-Mail für einen deutschen Bewerber.

Bewerber:
- Name: ${profile.fullName || '(nicht gesetzt)'}
- Signatur unter dem Gruß: ${profile.signature || '(keine)'}

Zielstelle:
- Firma: ${input.companyName || '(unbekannt)'}
- Titel: ${input.jobTitle || '(unbekannt)'}
- ${contactLine}
- Stack: ${input.stack || '(unbekannt)'}
- Beschreibung: ${(input.jobDescription || '').slice(0, 500)}

Stil-Anweisung des Bewerbers (IMMER befolgen):
${instruction}

Gib ein JSON ohne Markdown-Codeblöcke zurück:
{
  "subject": "Bewerbung: <Jobtitel> bei <Firma>",
  "body": "<HTML-Body mit <p>-Tags, keine Inline-Styles>"
}

Der Body muss enthalten:
- Anrede (siehe oben)
- Kurze Motivation: Bezug zur Stelle, warum diese Firma
- Hinweis "Lebenslauf im Anhang"
- Grußformel ("Mit freundlichen Grüßen" oder passend zur Stil-Anweisung)
- Name des Bewerbers
- Signatur (als eigener <p>), falls oben angegeben
`;
}

/**
 * Generate a cover-email draft via the local LLM. Uses the user's
 * emailInstruction from the profile as the tone/style guide. Falls back
 * with an error when Ollama is offline so the caller can show the static
 * template instead.
 */
export async function draftEmail(input: ApplicationInput): Promise<EmailDraft> {
    const { ollamaUrl, ollamaModel } = getLlmConfig();
    const response = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: ollamaModel,
            prompt: buildPrompt(input),
            stream: false,
            format: 'json',
            options: { temperature: 0.4 },
        }),
        signal: AbortSignal.timeout(OLLAMA_FETCH_TIMEOUT_MS),
    });

    if (!response.ok) {
        throw new Error(
            `Ollama unreachable (${response.status}). Is \`ollama serve\` running?`,
        );
    }

    const json = (await response.json()) as { response: string };
    const raw = json.response.trim();

    try {
        const parsed = JSON.parse(raw) as Partial<EmailDraft>;
        return {
            subject: String(parsed.subject || '').slice(0, 200),
            body: String(parsed.body || '').slice(0, 20000),
        };
    } catch {
        throw new Error(`LLM response could not be parsed: ${raw.slice(0, 200)}`);
    }
}
