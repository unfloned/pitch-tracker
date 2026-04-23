import type { SortBy, StatusFilter } from './types';

const KEY = 'pitchtracker.candidates.prefs.v1';

export type CandidateBucketPref = 'active' | 'ignored';

export interface CandidatesPrefs {
    minScore: number;
    sourceFilter: string[];
    statusFilter: StatusFilter;
    sortBy: SortBy;
    bucket: CandidateBucketPref;
}

const DEFAULTS: CandidatesPrefs = {
    minScore: 50,
    sourceFilter: [],
    statusFilter: 'all',
    sortBy: 'score_desc',
    bucket: 'active',
};

export function loadCandidatesPrefs(): CandidatesPrefs {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return DEFAULTS;
        const parsed = JSON.parse(raw) as Partial<CandidatesPrefs>;
        return {
            minScore:
                typeof parsed.minScore === 'number' ? parsed.minScore : DEFAULTS.minScore,
            sourceFilter: Array.isArray(parsed.sourceFilter)
                ? parsed.sourceFilter.filter((v): v is string => typeof v === 'string')
                : DEFAULTS.sourceFilter,
            statusFilter: (parsed.statusFilter as StatusFilter) ?? DEFAULTS.statusFilter,
            sortBy: (parsed.sortBy as SortBy) ?? DEFAULTS.sortBy,
            bucket:
                parsed.bucket === 'active' || parsed.bucket === 'ignored'
                    ? parsed.bucket
                    : DEFAULTS.bucket,
        };
    } catch {
        return DEFAULTS;
    }
}

export function saveCandidatesPrefs(patch: Partial<CandidatesPrefs>): void {
    try {
        const current = loadCandidatesPrefs();
        const next = { ...current, ...patch };
        localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
        // ignore quota errors
    }
}
