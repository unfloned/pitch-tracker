import type { ApplicationStatus, Priority, RemoteType } from '@shared/application';

/** One status change on an application, written on create and on status update. */
export interface ApplicationEventRow {
    id: string;
    applicationId: string;
    fromStatus: ApplicationStatus | null;
    toStatus: ApplicationStatus;
    changedAt: Date;
}

/** Fully-hydrated application row — list fields are parsed, dates are Dates. */
export interface ApplicationRow {
    id: string;
    companyName: string;
    companyWebsite: string;
    jobTitle: string;
    jobUrl: string;
    jobDescription: string;
    location: string;
    remote: RemoteType;
    salaryMin: number;
    salaryMax: number;
    salaryCurrency: string;
    stack: string;
    status: ApplicationStatus;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    notes: string;
    tags: string;
    priority: Priority;
    requiredProfile: string[];
    benefits: string[];
    interviews: string[];
    matchScore: number;
    matchReason: string;
    source: string;
    appliedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

/** Raw row shape as returned by better-sqlite3 before list/date coercion. */
export interface RawApplicationRow {
    id: string;
    companyName: string;
    companyWebsite: string;
    jobTitle: string;
    jobUrl: string;
    jobDescription: string;
    location: string;
    remote: RemoteType;
    salaryMin: number;
    salaryMax: number;
    salaryCurrency: string;
    stack: string;
    status: ApplicationStatus;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    notes: string;
    tags: string;
    priority: Priority;
    requiredProfile: string;
    benefits: string;
    interviews: string;
    matchScore: number;
    matchReason: string;
    source: string;
    appliedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

/** One email previously sent for an application. */
export interface EmailLogRow {
    id: string;
    applicationId: string;
    toAddress: string;
    subject: string;
    body: string;
    sentAt: Date;
    messageId: string | null;
    status: string;
}
