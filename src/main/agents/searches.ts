import { randomUUID } from 'node:crypto';
import type { JobSearchInput, SerializedJobSearch } from '@shared/job-search';
import { getDb } from './db';
import type { JobSearchRow } from './types';
import { nowIso, toSerializedSearch } from './utils';

export function listSearches(): SerializedJobSearch[] {
    const rows = getDb()
        .prepare('SELECT * FROM job_searches ORDER BY createdAt DESC')
        .all() as JobSearchRow[];
    return rows.map(toSerializedSearch);
}

function getSearchRow(id: string): JobSearchRow | null {
    const row = getDb()
        .prepare('SELECT * FROM job_searches WHERE id = ?')
        .get(id) as JobSearchRow | undefined;
    return row ?? null;
}

export function getSearch(id: string): SerializedJobSearch | null {
    const row = getSearchRow(id);
    return row ? toSerializedSearch(row) : null;
}

export function createSearch(input: JobSearchInput): SerializedJobSearch {
    const id = randomUUID();
    const now = nowIso();
    const sources = input.sources && input.sources.length > 0 ? input.sources : ['germantechjobs'];
    getDb()
        .prepare(
            `INSERT INTO job_searches
            (id, label, keywords, sources, locationFilter, remoteOnly, minSalary, enabled, interval, createdAt, updatedAt)
            VALUES (@id, @label, @keywords, @sources, @locationFilter, @remoteOnly, @minSalary, @enabled, @interval, @createdAt, @updatedAt)`,
        )
        .run({
            id,
            label: input.label || 'Unnamed search',
            keywords: input.keywords || '',
            sources: JSON.stringify(sources),
            locationFilter: input.locationFilter || '',
            remoteOnly: input.remoteOnly ? 1 : 0,
            minSalary: input.minSalary ?? 0,
            enabled: input.enabled === false ? 0 : 1,
            interval: input.interval ?? '6h',
            createdAt: now,
            updatedAt: now,
        });
    return getSearch(id)!;
}

export function updateSearch(id: string, input: JobSearchInput): SerializedJobSearch {
    const existing = getSearch(id);
    if (!existing) throw new Error(`Search ${id} not found`);
    const sources =
        input.sources !== undefined && input.sources.length > 0
            ? input.sources
            : existing.sources;
    const merged: Record<string, unknown> = {
        id,
        label: input.label ?? existing.label,
        keywords: input.keywords ?? existing.keywords,
        sources: JSON.stringify(sources),
        locationFilter: input.locationFilter ?? existing.locationFilter,
        remoteOnly: (input.remoteOnly ?? existing.remoteOnly) ? 1 : 0,
        minSalary: input.minSalary ?? existing.minSalary,
        enabled: (input.enabled ?? existing.enabled) ? 1 : 0,
        interval: input.interval ?? existing.interval,
        updatedAt: nowIso(),
    };
    getDb()
        .prepare(
            `UPDATE job_searches SET
                label = @label, keywords = @keywords, sources = @sources,
                locationFilter = @locationFilter, remoteOnly = @remoteOnly,
                minSalary = @minSalary, enabled = @enabled, interval = @interval,
                updatedAt = @updatedAt
            WHERE id = @id`,
        )
        .run(merged);
    return getSearch(id)!;
}

export function deleteSearch(id: string): void {
    getDb().prepare('DELETE FROM job_searches WHERE id = ?').run(id);
    getDb().prepare('DELETE FROM job_candidates WHERE searchId = ?').run(id);
}

/** Updates only the lastRunAt stamp — used by the runner after a search run finishes. */
export function touchSearchLastRun(id: string, finishedAt: string): void {
    getDb().prepare('UPDATE job_searches SET lastRunAt = ? WHERE id = ?').run(finishedAt, id);
}
