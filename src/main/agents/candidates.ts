import type { JobCandidateInput, SerializedJobCandidate } from '@shared/job-search';
import { CANDIDATE_SEARCH_LIMIT } from '../constants';
import { getDb } from './db';
import type { JobCandidateRow } from './types';
import { toSerializedCandidate } from './utils';

export function listCandidates(minScore: number = 0): SerializedJobCandidate[] {
    const rows = getDb()
        .prepare(
            "SELECT * FROM job_candidates WHERE score >= ? AND status != 'ignored' ORDER BY favorite DESC, score DESC, discoveredAt DESC LIMIT ?",
        )
        .all(minScore, CANDIDATE_SEARCH_LIMIT) as JobCandidateRow[];
    return rows.map(toSerializedCandidate);
}

export function updateCandidate(id: string, input: JobCandidateInput): SerializedJobCandidate {
    const updates: Record<string, unknown> = { id };
    const sets: string[] = [];
    if (input.status !== undefined) {
        sets.push('status = @status');
        updates.status = input.status;
    }
    if (input.importedApplicationId !== undefined) {
        sets.push('importedApplicationId = @importedApplicationId');
        updates.importedApplicationId = input.importedApplicationId;
    }
    if (input.favorite !== undefined) {
        sets.push('favorite = @favorite');
        updates.favorite = input.favorite ? 1 : 0;
    }
    if (sets.length > 0) {
        getDb()
            .prepare(`UPDATE job_candidates SET ${sets.join(', ')} WHERE id = @id`)
            .run(updates);
    }
    const row = getDb()
        .prepare('SELECT * FROM job_candidates WHERE id = ?')
        .get(id) as JobCandidateRow;
    return toSerializedCandidate(row);
}

export function bulkUpdateCandidates(ids: string[], input: JobCandidateInput): number {
    if (ids.length === 0) return 0;
    const sets: string[] = [];
    const params: Record<string, unknown> = {};
    if (input.status !== undefined) {
        sets.push('status = @status');
        params.status = input.status;
    }
    if (input.favorite !== undefined) {
        sets.push('favorite = @favorite');
        params.favorite = input.favorite ? 1 : 0;
    }
    if (sets.length === 0) return 0;
    const placeholders = ids.map((_, i) => `@id${i}`).join(', ');
    ids.forEach((id, i) => (params[`id${i}`] = id));
    const result = getDb()
        .prepare(`UPDATE job_candidates SET ${sets.join(', ')} WHERE id IN (${placeholders})`)
        .run(params);
    return result.changes;
}
