import type { ApplicationStatus } from '@shared/application';

/** Stages rendered in the 5-step progress bar (terminal states handled separately). */
export const PROGRESS_STAGES: ApplicationStatus[] = [
    'draft',
    'applied',
    'in_review',
    'interview_scheduled',
    'offer_received',
];

/** Short English labels used inside the progress bar. */
export const STAGE_SHORT_LABEL: Record<ApplicationStatus, string> = {
    draft: 'Draft',
    applied: 'Applied',
    in_review: 'Review',
    interview_scheduled: 'Interview',
    interviewed: 'Interview',
    offer_received: 'Offer',
    accepted: 'Accepted',
    rejected: 'Rejected',
    withdrawn: 'Withdrawn',
};
