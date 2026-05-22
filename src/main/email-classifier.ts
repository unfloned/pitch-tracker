import type { ApplicationStatus } from '@shared/application';
import { getLlmConfig } from './llm';
import { inlineEscape, newNonce, untrustedNotice, wrapUntrusted } from './llm/sanitize';
import type { ApplicationRow } from './db/types';

export interface ClassifyInput {
    subject: string;
    fromAddress: string;
    fromName: string;
    bodyText: string;
    context?: ClassifyContext;
}

export interface ContextInboundMessage {
    receivedAt: string;
    fromAddress: string;
    subject: string;
    bodyText: string;
    matchedApplicationId: string | null;
    suggestedStatus: ApplicationStatus | 'other' | null;
}

export interface ContextSentMessage {
    sentAt: string;
    toAddress: string;
    subject: string;
    body: string;
}

export interface ClassifyContext {
    /** Already-known application this thread or sender belongs to. */
    likelyApplication?: {
        id: string;
        companyName: string;
        jobTitle: string;
        status: ApplicationStatus;
        notes: string;
        interviews: string[];
    };
    /** Previous inbound mails relevant to this thread (oldest first). */
    previousInbound: ContextInboundMessage[];
    /** Previous outbound mails sent for this thread (oldest first). */
    previousSent: ContextSentMessage[];
}

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

function systemPrompt(nonce: string): string {
    return `Du analysierst eine eingehende E-Mail zu einer laufenden Bewerbung und ordnest sie einer Bewerbung zu, falls möglich. Gib AUSSCHLIESSLICH JSON zurück, kein Markdown.

${untrustedNotice(nonce)}

Zuordnung (Feld "applicationId"):
- Match nur wenn Absender-Domain oder Signatur klar zur Firma einer Bewerbung gehört, oder die Mail einen Jobtitel nennt der zur Bewerbung passt.
- Wenn ein "# Verlauf" mitgegeben ist: die Mail ist mit hoher Wahrscheinlichkeit eine Fortsetzung dieses Threads. Vertraue dem Verlauf wenn Absender + Thema konsistent sind.
- Bei Unsicherheit: null. Nicht raten.

Status-Vorschlag (Feld "status"):
- "rejected": Absage ("wir haben uns leider für einen anderen Kandidaten entschieden", "Absage", "nicht weitergekommen").
- "interview_scheduled": Einladung zum Gespräch / Termin-Vorschlag / Telefoninterview-Zeit.
- "interviewed": Rückmeldung NACH einem geführten Gespräch.
- "offer_received": Angebot, Vertrag, Gehaltsrahmen genannt, "freuen uns dich anzubieten".
- "in_review": Eingangsbestätigung, "wir prüfen", "melden uns bald".
- "other": alles andere (Newsletter, Spam, Follow-Up ohne klare Statusänderung).

Wenn ein "# Verlauf" zeigt dass der Status bereits weiter ist (z.B. schon "interviewed"), gehe nicht auf einen früheren Status zurück - es sei denn die Mail sagt explizit was Neues (z.B. Reschedule).

Feld "confidence" (0-100): wie sicher bist du beim Matching + Status-Vorschlag. Bei vorhandenem Verlauf der zur Mail passt: höhere Confidence rechtfertigt.
Feld "note" (max 280 Zeichen): die wichtigste Info aus der Mail für den Nutzer. Bei interview_scheduled unbedingt Datum/Uhrzeit zitieren falls vorhanden. Bei offer_received Gehaltsbereich oder Start-Datum wenn genannt. Keine Floskeln.

Gib exakt dieses JSON:
{
  "applicationId": "id-string-oder-null",
  "status": "rejected" | "interview_scheduled" | "interviewed" | "offer_received" | "in_review" | "other",
  "confidence": number,
  "note": "kurze Zusammenfassung"
}`;
}

const CONTEXT_BODY_LIMIT = 1500;
const MAX_CONTEXT_INBOUND = 5;
const MAX_CONTEXT_SENT = 3;

/**
 * Build the full LLM prompt for an inbound mail. Pulled out as a pure
 * function so adversarial test cases can assert against the exact string
 * that goes to the model.
 */
export function buildClassifierPrompt(
    input: ClassifyInput,
    activeApplications: ApplicationRow[],
    nonce: string,
): string {
    // JSON per row is robust against quote-injection: JSON.stringify escapes
    // every quote, newline and control character automatically. The attacker
    // can't break out of an attribute by typing " or '.
    const appsBlock =
        activeApplications.length === 0
            ? '(keine aktiven Bewerbungen)'
            : activeApplications
                  .map(
                      (a, i) =>
                          `${i + 1}. ${JSON.stringify({
                              id: a.id.slice(0, 64),
                              companyName: a.companyName.slice(0, 200),
                              jobTitle: a.jobTitle.slice(0, 200),
                              contactEmail: a.contactEmail.slice(0, 120),
                          })}`,
                  )
                  .join('\n');

    const contextBlock = buildContextBlock(input.context, nonce);

    const userBlock = `# Aktive Bewerbungen (vertrauenswürdige Liste, JSON pro Zeile)
${appsBlock}
${contextBlock}
# Eingehende Mail
Absender: ${inlineEscape(input.fromName, 200)} <${inlineEscape(input.fromAddress, 200)}>
Betreff: ${wrapUntrusted('subject', input.subject, nonce)}

Body:
${wrapUntrusted('body', input.bodyText.slice(0, 6000), nonce)}`;

    return systemPrompt(nonce) + '\n\n' + userBlock;
}

/**
 * Pure output-validation step. Exported so adversarial tests can assert
 * that a poisoned LLM response cannot smuggle a non-existent applicationId,
 * a bogus status or an out-of-range confidence past us.
 */
export function parseClassifierResponse(
    raw: string,
    activeApplications: ApplicationRow[],
    prompt: string,
): ClassifyOutput {
    return parseResponse(raw, activeApplications, prompt);
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
        return parseResponse(raw, activeApplications, fullPrompt);
    } catch (err) {
        return empty(`Ollama offline: ${(err as Error).message}`, fullPrompt, '');
    }
}

function buildContextBlock(
    context: ClassifyContext | undefined,
    nonce: string,
): string {
    if (!context) return '';
    const app = context.likelyApplication;
    const lines: string[] = ['', '# Verlauf (vorab-Match per Thread/Domain, vertrauenswürdige Header)'];

    if (app) {
        lines.push(
            `Wahrscheinlich passende Bewerbung: ${JSON.stringify({
                id: app.id.slice(0, 64),
                companyName: app.companyName.slice(0, 200),
                jobTitle: app.jobTitle.slice(0, 200),
                status: app.status.slice(0, 30),
            })}`,
        );
        if (app.notes && app.notes.trim().length > 0) {
            lines.push(`Notizen: ${wrapUntrusted('notes', app.notes.slice(0, 500), nonce)}`);
        }
        if (app.interviews.length > 0) {
            lines.push(
                `Interviews bisher: ${JSON.stringify(app.interviews.map((i) => i.slice(0, 100)))}`,
            );
        }
    }

    const sortedInbound = [...context.previousInbound]
        .sort((a, b) => a.receivedAt.localeCompare(b.receivedAt))
        .slice(-MAX_CONTEXT_INBOUND);
    const sortedSent = [...context.previousSent]
        .sort((a, b) => a.sentAt.localeCompare(b.sentAt))
        .slice(-MAX_CONTEXT_SENT);

    const merged: Array<{ when: string; line: string }> = [];

    for (const m of sortedSent) {
        merged.push({
            when: m.sentAt,
            line: `[${formatDate(m.sentAt)}] ICH → ${inlineEscape(m.toAddress, 200)} · ${JSON.stringify({ subject: m.subject.slice(0, 200) })}\n${wrapUntrusted('sent_body', truncate(m.body, CONTEXT_BODY_LIMIT), nonce)}`,
        });
    }
    for (const m of sortedInbound) {
        merged.push({
            when: m.receivedAt,
            line: `[${formatDate(m.receivedAt)}] ${inlineEscape(m.fromAddress, 200)} → ICH · ${JSON.stringify({
                subject: m.subject.slice(0, 200),
                matchedApplicationId: (m.matchedApplicationId ?? '-').slice(0, 64),
                suggestedStatus: (m.suggestedStatus ?? '-').slice(0, 30),
            })}\n${wrapUntrusted('prev_body', truncate(m.bodyText, CONTEXT_BODY_LIMIT), nonce)}`,
        });
    }

    if (merged.length === 0 && !app) return '';

    merged.sort((a, b) => a.when.localeCompare(b.when));
    if (merged.length > 0) {
        lines.push('', '## Bisheriger Mail-Verkehr (älteste zuerst):');
        for (const m of merged) lines.push(m.line, '');
    }
    lines.push('');
    return lines.join('\n');
}

function formatDate(iso: string): string {
    try {
        return new Date(iso).toISOString().slice(0, 10);
    } catch {
        return iso;
    }
}

function truncate(text: string, limit: number): string {
    if (text.length <= limit) return text;
    return text.slice(0, limit) + '… [gekürzt]';
}

function parseResponse(
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
