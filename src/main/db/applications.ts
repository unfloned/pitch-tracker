import { randomUUID } from 'node:crypto';
import type { ApplicationInput, ApplicationStatus } from '@shared/application';
import { recordEvent } from './events';
import { getDb } from './init';
import type { ApplicationRow, RawApplicationRow } from './types';
import { APPLICATION_FIELDS, fromRaw, nowIso, stringifyList } from './utils';

export function listApplications(): ApplicationRow[] {
    const rows = getDb()
        .prepare('SELECT * FROM applications ORDER BY updatedAt DESC')
        .all() as RawApplicationRow[];
    return rows.map(fromRaw);
}

export function getApplication(id: string): ApplicationRow | null {
    const row = getDb()
        .prepare('SELECT * FROM applications WHERE id = ?')
        .get(id) as RawApplicationRow | undefined;
    return row ? fromRaw(row) : null;
}

export function createApplication(input: ApplicationInput): ApplicationRow {
    const id = randomUUID();
    const now = nowIso();
    const values: Record<string, unknown> = {
        id,
        companyName: input.companyName ?? '',
        companyWebsite: input.companyWebsite ?? '',
        jobTitle: input.jobTitle ?? '',
        jobUrl: input.jobUrl ?? '',
        jobDescription: input.jobDescription ?? '',
        location: input.location ?? '',
        remote: input.remote ?? 'onsite',
        salaryMin: input.salaryMin ?? 0,
        salaryMax: input.salaryMax ?? 0,
        salaryCurrency: input.salaryCurrency || 'EUR',
        stack: input.stack ?? '',
        status: input.status ?? 'draft',
        contactName: input.contactName ?? '',
        contactEmail: input.contactEmail ?? '',
        contactPhone: input.contactPhone ?? '',
        notes: input.notes ?? '',
        tags: input.tags ?? '',
        priority: input.priority ?? 'medium',
        requiredProfile: stringifyList(input.requiredProfile),
        benefits: stringifyList(input.benefits),
        interviews: stringifyList(input.interviews),
        matchScore: input.matchScore ?? 0,
        matchReason: input.matchReason ?? '',
        source: input.source ?? '',
        appliedAt: input.appliedAt ? input.appliedAt.toISOString() : null,
        createdAt: now,
        updatedAt: now,
    };

    const columns = Object.keys(values);
    const placeholders = columns.map((c) => `@${c}`).join(', ');
    getDb()
        .prepare(`INSERT INTO applications (${columns.join(', ')}) VALUES (${placeholders})`)
        .run(values);

    // Seed event so the application shows up in history from its creation.
    recordEvent(id, null, values.status as ApplicationStatus, now);
    return getApplication(id)!;
}

export function updateApplication(id: string, input: ApplicationInput): ApplicationRow {
    const existing = getApplication(id);
    if (!existing) throw new Error(`Application ${id} not found`);

    const now = nowIso();
    const updates: Record<string, unknown> = { updatedAt: now };
    for (const field of APPLICATION_FIELDS) {
        if (input[field] !== undefined) {
            if (field === 'requiredProfile' || field === 'benefits' || field === 'interviews') {
                updates[field] = stringifyList(input[field] as string[]);
            } else {
                updates[field] = input[field];
            }
        }
    }
    if (input.appliedAt !== undefined) {
        updates.appliedAt = input.appliedAt ? input.appliedAt.toISOString() : null;
    }

    const setClause = Object.keys(updates)
        .map((c) => `${c} = @${c}`)
        .join(', ');
    getDb()
        .prepare(`UPDATE applications SET ${setClause} WHERE id = @id`)
        .run({ ...updates, id });

    // Log the status transition only when status actually changed. Keeps the
    // event log honest (a field-only edit does not count as a stage change).
    if (input.status !== undefined && input.status !== existing.status) {
        recordEvent(id, existing.status, input.status, now);
    }

    return getApplication(id)!;
}

export function deleteApplication(id: string): void {
    // Events + email_log cascade via ON DELETE CASCADE in the schema.
    getDb().prepare('DELETE FROM applications WHERE id = ?').run(id);
}
