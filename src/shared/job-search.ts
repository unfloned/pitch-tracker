export type JobSource = 'germantechjobs' | 'join' | 'url';

export const JOB_SOURCE_LABEL: Record<JobSource, string> = {
    germantechjobs: 'GermanTechJobs',
    join: 'Join.com',
    url: 'Einzelne URL',
};

export interface JobSearch {
    id: string;
    label: string;
    keywords: string;
    source: JobSource;
    locationFilter: string;
    remoteOnly: boolean;
    minSalary: number;
    enabled: boolean;
    lastRunAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface JobSearchInput {
    label?: string;
    keywords?: string;
    source?: JobSource;
    locationFilter?: string;
    remoteOnly?: boolean;
    minSalary?: number;
    enabled?: boolean;
}

export type CandidateStatus = 'new' | 'interested' | 'ignored' | 'imported';

export const CANDIDATE_STATUS_LABEL: Record<CandidateStatus, string> = {
    new: 'Neu',
    interested: 'Interessant',
    ignored: 'Verworfen',
    imported: 'Übernommen',
};

export interface JobCandidate {
    id: string;
    searchId: string;
    sourceUrl: string;
    sourceKey: string;
    title: string;
    company: string;
    location: string;
    summary: string;
    score: number;
    scoreReason: string;
    status: CandidateStatus;
    discoveredAt: Date;
    importedApplicationId: string | null;
}

export interface JobCandidateInput {
    status?: CandidateStatus;
    importedApplicationId?: string | null;
}

export interface SerializedJobSearch extends Omit<JobSearch, 'lastRunAt' | 'createdAt' | 'updatedAt'> {
    lastRunAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface SerializedJobCandidate extends Omit<JobCandidate, 'discoveredAt'> {
    discoveredAt: string;
}
