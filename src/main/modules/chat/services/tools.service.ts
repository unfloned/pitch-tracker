import type { ApplicationStatus } from '@shared/application';
import { listCandidates } from '../../agents';
import { listApplications } from '../../../db';

/**
 * Function-calling schemas sent to Ollama on every chat request. Keep this
 * list in sync with the `runTool` switch below - the LLM expects each name
 * here to dispatch to a real handler.
 */
export const CHAT_TOOLS = [
    {
        type: 'function',
        function: {
            name: 'list_applications',
            description: 'Listet Bewerbungen, optional gefiltert nach Status.',
            parameters: {
                type: 'object',
                properties: {
                    status: {
                        type: 'string',
                        enum: [
                            'draft',
                            'applied',
                            'in_review',
                            'interview_scheduled',
                            'interviewed',
                            'offer_received',
                            'accepted',
                            'rejected',
                            'withdrawn',
                        ],
                        description: 'Optionaler Status-Filter',
                    },
                    limit: {
                        type: 'number',
                        description: 'Maximale Anzahl (Standard 20)',
                    },
                },
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'count_by_status',
            description: 'Zählt Bewerbungen pro Status.',
            parameters: { type: 'object', properties: {} },
        },
    },
    {
        type: 'function',
        function: {
            name: 'stats',
            description:
                'Liefert Gesamtstatistiken: Total, durchschnittlicher Match-Score, häufigste Firmen, durchschnittliche Bearbeitungsdauer.',
            parameters: { type: 'object', properties: {} },
        },
    },
    {
        type: 'function',
        function: {
            name: 'list_candidates',
            description: 'Listet Agent-Kandidaten, optional mit Mindest-Score.',
            parameters: {
                type: 'object',
                properties: {
                    minScore: {
                        type: 'number',
                        description: 'Mindest-Score (0-100)',
                    },
                    limit: {
                        type: 'number',
                        description: 'Maximale Anzahl (Standard 20)',
                    },
                },
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'search_applications',
            description:
                'Sucht in Firma, Job-Titel, Notes und Tags (Substring-Suche, case-insensitive).',
            parameters: {
                type: 'object',
                properties: {
                    query: { type: 'string', description: 'Suchtext' },
                },
                required: ['query'],
            },
        },
    },
];

/**
 * Dispatch a tool call coming back from the LLM. Inputs are coerced and
 * clamped so a malicious tool-call payload can't pull an unbounded amount
 * of data; outputs are plain values that JSON.stringify safely.
 */
export function runTool(
    name: string,
    argsRaw: Record<string, unknown> | string,
): unknown {
    const args: Record<string, unknown> =
        typeof argsRaw === 'string' ? safeJson(argsRaw) : argsRaw || {};

    if (name === 'list_applications') {
        const status = args.status as ApplicationStatus | undefined;
        const limit = clampNum(args.limit, 1, 100, 20);
        let rows = listApplications();
        if (status) rows = rows.filter((r) => r.status === status);
        return {
            total: rows.length,
            items: rows.slice(0, limit).map((r) => ({
                company: r.companyName,
                title: r.jobTitle,
                status: r.status,
                matchScore: r.matchScore,
                appliedAt: r.appliedAt?.toISOString().slice(0, 10) ?? null,
                updatedAt: r.updatedAt.toISOString().slice(0, 10),
            })),
        };
    }

    if (name === 'count_by_status') {
        const rows = listApplications();
        const counts: Record<string, number> = {};
        for (const r of rows) counts[r.status] = (counts[r.status] ?? 0) + 1;
        return { total: rows.length, counts };
    }

    if (name === 'stats') {
        const rows = listApplications();
        const scored = rows.filter((r) => r.matchScore > 0);
        const avgMatchScore = scored.length
            ? Math.round(scored.reduce((s, r) => s + r.matchScore, 0) / scored.length)
            : 0;
        const companyCounts: Record<string, number> = {};
        for (const r of rows) {
            if (!r.companyName) continue;
            companyCounts[r.companyName] = (companyCounts[r.companyName] ?? 0) + 1;
        }
        const topCompanies = Object.entries(companyCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));

        const now = Date.now();
        const recent = rows.filter((r) => {
            if (!r.appliedAt) return false;
            return now - r.appliedAt.getTime() < 30 * 24 * 3600 * 1000;
        }).length;

        return {
            total: rows.length,
            avgMatchScore,
            scoredCount: scored.length,
            topCompanies,
            appliedLast30Days: recent,
        };
    }

    if (name === 'list_candidates') {
        const minScore = clampNum(args.minScore, 0, 100, 0);
        const limit = clampNum(args.limit, 1, 100, 20);
        const cands = listCandidates(minScore);
        return {
            total: cands.length,
            items: cands.slice(0, limit).map((c) => ({
                company: c.company,
                title: c.title,
                score: c.score,
                source: c.sourceKey?.split(':')[0] ?? '',
                status: c.status,
                location: c.location,
            })),
        };
    }

    if (name === 'search_applications') {
        const query = String(args.query ?? '').toLowerCase().trim();
        if (!query) return { total: 0, items: [] };
        const rows = listApplications().filter((r) => {
            const hay = [
                r.companyName,
                r.jobTitle,
                r.notes,
                r.tags,
                r.stack,
                r.location,
            ]
                .join(' ')
                .toLowerCase();
            return hay.includes(query);
        });
        return {
            total: rows.length,
            items: rows.slice(0, 20).map((r) => ({
                company: r.companyName,
                title: r.jobTitle,
                status: r.status,
                matchScore: r.matchScore,
            })),
        };
    }

    return { error: `Unknown tool: ${name}` };
}

function safeJson(raw: string): Record<string, unknown> {
    try {
        return JSON.parse(raw) as Record<string, unknown>;
    } catch {
        return {};
    }
}

function clampNum(value: unknown, min: number, max: number, fallback: number): number {
    const n = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, Math.round(n)));
}
