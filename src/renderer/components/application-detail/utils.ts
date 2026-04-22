import type { ApplicationStatus } from '@shared/application';

/**
 * Position in the 5-step progress bar. Statuses that collapse (interviewed
 * → interview_scheduled, accepted → offer_received) share the slot ahead.
 * Returns -1 for terminal states that should render the closed banner instead.
 */
export function stageIndex(status: ApplicationStatus): number {
    const map: Partial<Record<ApplicationStatus, number>> = {
        draft: 0,
        applied: 1,
        in_review: 2,
        interview_scheduled: 3,
        interviewed: 3,
        offer_received: 4,
        accepted: 4,
    };
    return map[status] ?? -1;
}

export function priorityLabel(p: string, t: (k: string) => string): string {
    return t(`priority.${p}`) || p.toUpperCase();
}

export function remoteLabel(r: string, t: (k: string) => string): string {
    return t(`remote.${r}`) || r;
}
