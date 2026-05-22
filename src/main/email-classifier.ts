import type { ApplicationStatus } from '@shared/application';
import { getLlmConfig } from './llm';
import { inlineEscape, UNTRUSTED_NOTICE, wrapUntrusted } from './llm/sanitize';
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

const SYSTEM_PROMPT = `Du analysierst eine eingehende E-Mail zu einer laufenden Bewerbung und ordnest sie einer Bewerbung zu, falls möglich. Gib AUSSCHLIESSLICH JSON zurück, kein Markdown.

${UNTRUSTED_NOTICE}

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

const CONTEXT_BODY_LIMIT = 1500;
const MAX_CONTEXT_INBOUND = 5;
const MAX_CONTEXT_SENT = 3;

export async function classifyInboundEmail(
    input: ClassifyInput,
    activeApplications: ApplicationRow[],
): Promise<ClassifyOutput> {
    const { ollamaUrl, ollamaModel } = getLlmConfig();

    const appsBlock =
        activeApplications.length === 0
            ? '(keine aktiven Bewerbungen)'
            : activeApplications
                  .map(
                      (a, i) =>
                          `${i + 1}. id="${inlineEscape(a.id, 64)}" Firma="${inlineEscape(a.companyName)}" Titel="${inlineEscape(a.jobTitle)}" Kontakt="${inlineEscape(a.contactEmail, 120)}"`,
                  )
                  .join('\n');

    const contextBlock = buildContextBlock(input.context);

    const userBlock = `# Aktive Bewerbungen
${appsBlock}
${contextBlock}
# Eingehende Mail
Absender: ${inlineEscape(input.fromName, 200)} <${inlineEscape(input.fromAddress, 200)}>
Betreff: ${wrapUntrusted('subject', input.subject)}

Body:
${wrapUntrusted('body', input.bodyText.slice(0, 6000))}`;

    const fullPrompt = SYSTEM_PROMPT + '\n\n' + userBlock;

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

function buildContextBlock(context: ClassifyContext | undefined): string {
    if (!context) return '';
    const app = context.likelyApplication;
    const lines: string[] = ['', '# Verlauf (vorab-Match per Thread/Domain)'];

    if (app) {
        lines.push(
            `Wahrscheinlich passende Bewerbung: id="${inlineEscape(app.id, 64)}" Firma="${inlineEscape(app.companyName)}" Titel="${inlineEscape(app.jobTitle)}" aktueller Status="${inlineEscape(app.status, 30)}"`,
        );
        if (app.notes && app.notes.trim().length > 0) {
            lines.push(`Notizen: ${inlineEscape(app.notes, 500)}`);
        }
        if (app.interviews.length > 0) {
            lines.push(`Interviews bisher: ${app.interviews.map((i) => inlineEscape(i, 100)).join(' | ')}`);
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
            line: `[${formatDate(m.sentAt)}] ICH → ${inlineEscape(m.toAddress, 200)} · "${inlineEscape(m.subject)}"\n${wrapUntrusted('sent_body', truncate(m.body, CONTEXT_BODY_LIMIT))}`,
        });
    }
    for (const m of sortedInbound) {
        merged.push({
            when: m.receivedAt,
            line: `[${formatDate(m.receivedAt)}] ${inlineEscape(m.fromAddress, 200)} → ICH · "${inlineEscape(m.subject)}" (zugeordnet: ${inlineEscape(m.matchedApplicationId ?? '-', 64)}, Status: ${inlineEscape(m.suggestedStatus ?? '-', 30)})\n${wrapUntrusted('prev_body', truncate(m.bodyText, CONTEXT_BODY_LIMIT))}`,
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
