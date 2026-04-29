import type { ExtractedJobData } from '@shared/application';
import { stripHtmlPage } from '@shared/html';
import { LLM_PAGE_CHAR_LIMIT } from '../constants';
import { getLlmConfig } from './config';

const EXTRACTION_PROMPT = `Du analysierst eine deutsche Stellenanzeige und lieferst strukturierte Felder als JSON.

Extrahiere alles was im Text steht. Erfinde nichts. Wenn ein Feld nicht genannt ist: leeren String oder 0.

Gib exakt dieses JSON zurück, ohne Markdown-Codeblöcke, ohne Vorspann, ohne Kommentare:
{
  "companyName": "Firmenname",
  "jobTitle": "Stellentitel",
  "location": "Stadt/Region oder leer bei 100% Remote",
  "remote": "onsite" | "hybrid" | "remote",
  "salaryMin": number,
  "salaryMax": number,
  "stack": "Komma-separierte Tech-Stichworte aus dem Anforderungstext (z.B. TypeScript, React, Next.js, Postgres)",
  "jobDescription": "4-8 Sätze: Was macht das Team/die Firma, was ist die Rolle, welche Verantwortung. Konkret, mit Textbezug. KEINE Anforderungen oder Benefits hier - die gehen in die eigenen Felder unten.",
  "requiredProfile": ["konkrete Anforderung 1", "konkrete Anforderung 2", "..."],
  "benefits": ["Benefit 1", "Benefit 2", "..."],
  "source": "Job-Portal wenn erkennbar (stepstone, join, personio, germantechjobs, linkedin, indeed, etc.), sonst leer"
}

Regeln:
- jobDescription muss substantiell sein (4-8 Sätze), nicht 1-2. Beschreibt Rolle, Team und Kontext.
- requiredProfile = Liste. Jeder Bullet ist eine einzelne klare Anforderung. Keine Langtext-Absätze.
- benefits = Liste. Jeder Bullet ist ein einzelner Benefit.
- Gehalt nur wenn explizit im Text. Umrechnung Monatsgehalt->Jahresgehalt (×12) ist ok.

Stellenanzeigentext:
`;

/**
 * Pull the URL with a desktop user-agent (some portals serve mobile-stripped
 * pages to bots), strip the HTML to plain text, and truncate to keep us
 * inside the LLM's context window.
 */
async function fetchJobPage(url: string): Promise<string> {
    const response = await fetch(url, {
        headers: {
            'User-Agent':
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
            'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
        },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status} fetching URL`);
    const html = await response.text();
    return stripHtmlPage(html).slice(0, LLM_PAGE_CHAR_LIMIT);
}

/**
 * Scrape a job posting URL and ask the LLM to fill the application form.
 * Returns a fully-populated ExtractedJobData. Throws when Ollama is offline
 * or the JSON it returns can't be parsed.
 */
export async function extractJobData(url: string): Promise<ExtractedJobData> {
    const { ollamaUrl, ollamaModel } = getLlmConfig();
    const pageText = await fetchJobPage(url);

    const response = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: ollamaModel,
            prompt: EXTRACTION_PROMPT + pageText,
            stream: false,
            format: 'json',
            options: {
                temperature: 0.1,
                // Ollama's default caps output at 128 tokens, which truncates
                // the JSON mid-field. 2048 fits a full extraction with a multi-
                // sentence jobDescription, requirements list and benefits list.
                num_predict: 2048,
                // Page text can be up to LLM_PAGE_CHAR_LIMIT chars (~4-6k
                // tokens) + prompt. 16k keeps us safely inside most small
                // models (llama3.2 defaults to 128k, Qwen to 32k, etc.).
                num_ctx: 16384,
            },
        }),
    });

    if (!response.ok) {
        throw new Error(
            `Ollama unreachable (${response.status}). Is \`ollama serve\` running? Is the model \`${ollamaModel}\` installed?`,
        );
    }

    const json = (await response.json()) as { response: string };
    const raw = json.response.trim();

    try {
        const parsed = JSON.parse(raw) as Partial<ExtractedJobData>;
        return {
            companyName: parsed.companyName ?? '',
            jobTitle: parsed.jobTitle ?? '',
            location: parsed.location ?? '',
            remote: (parsed.remote as ExtractedJobData['remote']) ?? 'onsite',
            salaryMin: parsed.salaryMin ?? 0,
            salaryMax: parsed.salaryMax ?? 0,
            stack: parsed.stack ?? '',
            jobDescription: parsed.jobDescription ?? '',
            requiredProfile: normalizeList(parsed.requiredProfile),
            benefits: normalizeList(parsed.benefits),
            source: parsed.source ?? '',
        };
    } catch {
        throw new Error(`LLM response could not be parsed as JSON: ${raw.slice(0, 200)}`);
    }
}

/**
 * Coerce arbitrary LLM output into a clean string[]. Accepts arrays, newline-
 * separated text, and semicolon-separated text. Strips bullet prefixes.
 */
function normalizeList(value: unknown): string[] {
    if (Array.isArray(value)) {
        return value.map((v) => String(v).trim()).filter((v) => v.length > 0);
    }
    if (typeof value === 'string' && value.trim()) {
        return value
            .split(/\n|;/)
            .map((line) => line.replace(/^[\s\-•]+/, '').trim())
            .filter((line) => line.length > 0);
    }
    return [];
}
