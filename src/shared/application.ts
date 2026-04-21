import { entity, PrimaryKey, uuid, UUID } from '@deepkit/type';

export type ApplicationStatus =
    | 'draft'
    | 'applied'
    | 'in_review'
    | 'interview_scheduled'
    | 'interviewed'
    | 'offer_received'
    | 'accepted'
    | 'rejected'
    | 'withdrawn';

export type RemoteType = 'onsite' | 'hybrid' | 'remote';
export type Priority = 'low' | 'medium' | 'high';

export const STATUS_LABEL: Record<ApplicationStatus, string> = {
    draft: 'Entwurf',
    applied: 'Beworben',
    in_review: 'In Prüfung',
    interview_scheduled: 'Gespräch geplant',
    interviewed: 'Gespräch geführt',
    offer_received: 'Angebot erhalten',
    accepted: 'Angenommen',
    rejected: 'Abgelehnt',
    withdrawn: 'Zurückgezogen',
};

export const STATUS_ORDER: ApplicationStatus[] = [
    'draft',
    'applied',
    'in_review',
    'interview_scheduled',
    'interviewed',
    'offer_received',
    'accepted',
    'rejected',
    'withdrawn',
];

export const REMOTE_LABEL: Record<RemoteType, string> = {
    onsite: 'Vor Ort',
    hybrid: 'Hybrid',
    remote: '100% Remote',
};

export const PRIORITY_LABEL: Record<Priority, string> = {
    low: 'Niedrig',
    medium: 'Mittel',
    high: 'Hoch',
};

@entity.name('application')
export class Application {
    id: UUID & PrimaryKey = uuid();

    companyName: string = '';
    companyWebsite: string = '';
    jobTitle: string = '';
    jobUrl: string = '';
    jobDescription: string = '';

    location: string = '';
    remote: RemoteType = 'onsite';

    salaryMin: number = 0;
    salaryMax: number = 0;
    salaryCurrency: string = 'EUR';

    stack: string = '';
    status: ApplicationStatus = 'draft';

    contactName: string = '';
    contactEmail: string = '';
    contactPhone: string = '';

    notes: string = '';
    tags: string = '';
    priority: Priority = 'medium';

    requiredProfile: string[] = [];
    benefits: string[] = [];
    interviews: string[] = [];
    matchScore: number = 0;
    matchReason: string = '';

    source: string = '';
    appliedAt: Date | null = null;
    createdAt: Date = new Date();
    updatedAt: Date = new Date();
}

export interface ApplicationInput {
    companyName?: string;
    companyWebsite?: string;
    jobTitle?: string;
    jobUrl?: string;
    jobDescription?: string;
    location?: string;
    remote?: RemoteType;
    salaryMin?: number;
    salaryMax?: number;
    salaryCurrency?: string;
    stack?: string;
    status?: ApplicationStatus;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    notes?: string;
    tags?: string;
    priority?: Priority;
    requiredProfile?: string[];
    benefits?: string[];
    interviews?: string[];
    matchScore?: number;
    matchReason?: string;
    source?: string;
    appliedAt?: Date | null;
}

export interface ExtractedJobData {
    companyName: string;
    jobTitle: string;
    location: string;
    remote: RemoteType;
    salaryMin: number;
    salaryMax: number;
    stack: string;
    jobDescription: string;
    requiredProfile: string[];
    benefits: string[];
    source: string;
}

export interface FitAssessment {
    score: number;
    reason: string;
}
