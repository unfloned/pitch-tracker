import type { ApplicationStatus } from '@shared/application';

export const STAGE_ORDER: ApplicationStatus[] = [
    'draft',
    'applied',
    'in_review',
    'interview_scheduled',
    'interviewed',
    'offer_received',
    'accepted',
];

export const ACTIVE_STATUSES: ApplicationStatus[] = [
    'applied',
    'in_review',
    'interview_scheduled',
    'interviewed',
    'offer_received',
];
