import { randomUUID } from 'node:crypto';
import type { ApplicationStatus } from '@shared/application';
import { getDb } from './init';
import type { ApplicationEventRow } from './types';

/** Insert a status-change event row for the given application. */
export function recordEvent(
    applicationId: string,
    fromStatus: ApplicationStatus | null,
    toStatus: ApplicationStatus,
    changedAt: string,
): void {
    getDb()
        .prepare(
            'INSERT INTO application_events (id, applicationId, fromStatus, toStatus, changedAt) VALUES (?, ?, ?, ?, ?)',
        )
        .run(randomUUID(), applicationId, fromStatus, toStatus, changedAt);
}

export function listApplicationEvents(): ApplicationEventRow[] {
    const rows = getDb()
        .prepare(
            'SELECT id, applicationId, fromStatus, toStatus, changedAt FROM application_events ORDER BY changedAt ASC',
        )
        .all() as RawEventRow[];
    return rows.map(toEventRow);
}

export function listEventsForApplication(applicationId: string): ApplicationEventRow[] {
    const rows = getDb()
        .prepare(
            'SELECT id, applicationId, fromStatus, toStatus, changedAt FROM application_events WHERE applicationId = ? ORDER BY changedAt ASC',
        )
        .all(applicationId) as RawEventRow[];
    return rows.map(toEventRow);
}

interface RawEventRow {
    id: string;
    applicationId: string;
    fromStatus: ApplicationStatus | null;
    toStatus: ApplicationStatus;
    changedAt: string;
}

function toEventRow(r: RawEventRow): ApplicationEventRow {
    return {
        id: r.id,
        applicationId: r.applicationId,
        fromStatus: r.fromStatus,
        toStatus: r.toStatus,
        changedAt: new Date(r.changedAt),
    };
}
