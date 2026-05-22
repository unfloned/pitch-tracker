import type { ApplicationInput } from '@shared/application';
import { OLLAMA_FETCH_TIMEOUT_MS } from '../constants';
import { getLlmConfig } from '../llm';
import { inlineEscape, newNonce, untrustedNotice, wrapUntrusted } from '../llm/sanitize';
import { getUserProfile } from '../profile';

export interface EmailDraft {
    subject: string;
    body: string;
}

const DEFAULT_INSTRUCTION =
    'Ton: professionell, warm, kurz. Max. 4 Sätze im Hauptteil. Keine Buzzwords.';

function buildPrompt(input: ApplicationInput, nonce: string): string {
    const profile = getUserProfile();
    const instruction = profile.emailInstruction.trim() || DEFAULT_INSTRUCTION;
    const contactLine = input.contactName
        ? `Persönliche Anrede an ${inlineEscape(input.contactName, 100)}`
        : 'Anrede: "Sehr geehrte Damen und Herren" (kein Name bekannt)';

    return `Du entwirfst eine Bewerbungs-E-Mail für einen deutschen Bewerber.

${untrustedNotice(nonce)}

Bewerber (vertrauenswürdig):
- Name: ${profile.fullName || '(nicht gesetzt)'}
- Signatur unter dem Gruß: ${profile.signature || '(keine)'}

Zielstelle (DATEN aus externer Quelle):
- Firma: ${inlineEscape(input.companyName || '(unbekannt)')}
- Titel: ${inlineEscape(input.jobTitle || '(unbekannt)')}
- ${contactLine}
- Stack: ${inlineEscape(input.stack || '(unbekannt)', 500)}
- Beschreibung:
${wrapUntrusted('job_description', (input.jobDescription || '').slice(0, 500), nonce)}

Stil-Anweisung des Bewerbers (IMMER befolgen):
${instruction}

Gib ein JSON ohne Markdown-Codeblöcke zurück:
{
  "subject": "Bewerbung: <Jobtitel> bei <Firma>",
  "body": "<HTML-Body mit <p>-Tags, keine Inline-Styles, KEINE <script>/<iframe>/<style>/<link>/<object>/<embed>/<form> Tags und keine on*-Event-Attribute>"
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
    const nonce = newNonce();
    const response = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: ollamaModel,
            prompt: buildPrompt(input, nonce),
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
            subject: String(parsed.subject || '').replace(/[\r\n]+/g, ' ').slice(0, 200),
            body: sanitizeDraftHtml(String(parsed.body || '')).slice(0, 20000),
        };
    } catch {
        throw new Error(`LLM response could not be parsed: ${raw.slice(0, 200)}`);
    }
}

/**
 * Belt-and-braces filter against the LLM emitting XSS-relevant HTML in the
 * cover-mail body. The prompt asks it not to, but if a poisoned job
 * description tricked it into adding a script tag we strip it before the
 * body lands in the WYSIWYG editor.
 */
function sanitizeDraftHtml(html: string): string {
    return html
        .replace(/<\s*(script|style|iframe|object|embed|form|link|meta)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
        .replace(/<\s*(script|style|iframe|object|embed|form|link|meta)\b[^>]*\/?\s*>/gi, '')
        .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
        .replace(/javascript:/gi, '');
}
