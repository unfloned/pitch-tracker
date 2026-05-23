import type { ApplicationStatus } from '@shared/application';

/** Short English label for a status - rendered in funnel labels and transitions. */
export function stageShort(s: ApplicationStatus): string {
    return {
        draft: 'Draft',
        applied: 'Applied',
        in_review: 'Review',
        interview_scheduled: 'Interview',
        interviewed: 'Post-Int',
        offer_received: 'Offer',
        accepted: 'Accepted',
        rejected: 'Rejected',
        withdrawn: 'Withdrawn',
    }[s];
}

/** Monday 00:00:00 of the week containing `date`. */
export function startOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = (day + 6) % 7;
    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

/** ISO 8601 week number (1–53). */
export function isoWeek(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
