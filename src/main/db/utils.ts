import type { ApplicationInput } from '@shared/application';
import type { ApplicationRow, RawApplicationRow } from './types';

/** Fields that flow unchanged into the SQL INSERT / UPDATE for applications. */
export const APPLICATION_FIELDS: (keyof ApplicationInput)[] = [
    'companyName',
    'companyWebsite',
    'jobTitle',
    'jobUrl',
    'jobDescription',
    'location',
    'remote',
    'salaryMin',
    'salaryMax',
    'salaryCurrency',
    'stack',
    'status',
    'contactName',
    'contactEmail',
    'contactPhone',
    'notes',
    'tags',
    'priority',
    'requiredProfile',
    'benefits',
    'interviews',
    'matchScore',
    'matchReason',
    'source',
];

/**
 * Lists are stored as JSON strings. Legacy rows use newline-separated lists,
 * so we fall back to splitting on newlines if JSON parse fails.
 */
export function parseList(raw: string | null | undefined): string[] {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.filter((v) => typeof v === 'string');
    } catch {
        return raw
            .split(/\n/)
            .map((line) => line.replace(/^[\s\-•]+/, '').trim())
            .filter((line) => line.length > 0);
    }
    return [];
}

export function stringifyList(list: string[] | undefined): string {
    return JSON.stringify(list ?? []);
}

export function nowIso(): string {
    return new Date().toISOString();
}

/** Coerce raw DB columns into an ApplicationRow (lists parsed, dates typed). */
export function fromRaw(raw: RawApplicationRow): ApplicationRow {
    return {
        ...raw,
        requiredProfile: parseList(raw.requiredProfile),
        benefits: parseList(raw.benefits),
        interviews: parseList(raw.interviews),
        appliedAt: raw.appliedAt ? new Date(raw.appliedAt) : null,
        createdAt: new Date(raw.createdAt),
        updatedAt: new Date(raw.updatedAt),
    };
}
