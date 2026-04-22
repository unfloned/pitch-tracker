import type { ApplicationEventRow, ApplicationRow } from '../db';

/** Convert DB Date columns to ISO strings for IPC transport. */
export function serializeApplication(row: ApplicationRow) {
    return {
        ...row,
        appliedAt: row.appliedAt ? row.appliedAt.toISOString() : null,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
    };
}

export function serializeEvent(row: ApplicationEventRow) {
    return {
        id: row.id,
        applicationId: row.applicationId,
        fromStatus: row.fromStatus,
        toStatus: row.toStatus,
        changedAt: row.changedAt.toISOString(),
    };
}

/** Parse an IPC-transported ISO string back into a Date, keeping null/undefined. */
export function parseDate(value: unknown): Date | null | undefined {
    if (value === undefined) return undefined;
    if (value === null) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'string') return value ? new Date(value) : null;
    return null;
}
