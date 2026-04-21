import { getLlmConfig } from '../llm';

export interface ScoringProfile {
    stackKeywords: string;
    remotePreferred: boolean;
    minSalary: number;
    antiStack: string;
}

export interface ScoreResult {
    score: number;
    reason: string;
}

const SCORING_PROMPT = (profile: ScoringProfile) => `Du bewertest Jobanzeigen für einen deutschen Senior-TypeScript-Entwickler.

Profil des Kandidaten:
- Gewünschter Stack: ${profile.stackKeywords || 'TypeScript, Next.js, React, Node.js, React Native, Postgres'}
- Remote bevorzugt: ${profile.remotePreferred ? 'ja (100% Remote > Hybrid > Vor Ort)' : 'egal'}
- Minimum-Gehalt (wenn angegeben): ${profile.minSalary}€/Jahr
- No-Gos: ${profile.antiStack || 'Java-only, C#-only, PHP-only, reine Vue-/Angular-Rollen'}

Bewerte die folgende Jobanzeige auf einer Skala von 0 bis 100, wo:
- 90+ = perfekte Passung
- 70-89 = gute Passung
- 50-69 = möglich
- < 50 = wahrscheinlich kein Fit

Antworte nur mit JSON: { "score": number, "reason": "1-Satz-Begründung auf Deutsch" }

Jobanzeige:
`;

export async function scoreJobListing(
    title: string,
    company: string,
    location: string,
    summary: string,
    profile: ScoringProfile,
): Promise<ScoreResult> {
    const { ollamaUrl, ollamaModel } = getLlmConfig();
    const text = `Titel: ${title}\nFirma: ${company}\nOrt: ${location}\n\nBeschreibung:\n${summary}`;

    try {
        const response = await fetch(`${ollamaUrl}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: ollamaModel,
                prompt: SCORING_PROMPT(profile) + text,
                stream: false,
                format: 'json',
                options: { temperature: 0.2 },
            }),
            signal: AbortSignal.timeout(60000),
        });

        if (!response.ok) {
            return { score: 0, reason: `LLM-Fehler HTTP ${response.status}` };
        }

        const json = (await response.json()) as { response: string };
        try {
            const parsed = JSON.parse(json.response.trim()) as ScoreResult;
            const score = Math.max(0, Math.min(100, Number(parsed.score) || 0));
            const reason = typeof parsed.reason === 'string' ? parsed.reason.slice(0, 200) : '';
            return { score, reason };
        } catch {
            return { score: 0, reason: 'LLM-Antwort ungültig' };
        }
    } catch (err) {
        return { score: 0, reason: `Ollama offline: ${(err as Error).message}` };
    }
}
