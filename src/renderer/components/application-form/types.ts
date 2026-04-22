import type { UseFormReturnType } from '@mantine/form';
import type {
    ApplicationStatus,
    Priority,
    RemoteType,
} from '@shared/application';

/** Drawer-internal form shape. Mostly mirrors ApplicationInput, with Date
 *  for the appliedAt field because Mantine's DateInput hands us a Date. */
export interface FormValues {
    jobUrl: string;
    companyName: string;
    companyWebsite: string;
    jobTitle: string;
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
}

export type ApplicationForm = UseFormReturnType<FormValues>;
