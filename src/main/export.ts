import ExcelJS from 'exceljs';
import { listApplications } from './db';
import type { ApplicationStatus, Priority, RemoteType } from '@shared/application';

export interface ExportLabels {
    status: Record<ApplicationStatus, string>;
    remote: Record<RemoteType, string>;
    priority: Record<Priority, string>;
    headers: {
        status: string;
        match: string;
        company: string;
        jobTitle: string;
        location: string;
        remote: string;
        stack: string;
        salaryMin: string;
        salaryMax: string;
        currency: string;
        priority: string;
        contactName: string;
        contactEmail: string;
        contactPhone: string;
        tags: string;
        appliedAt: string;
        source: string;
        jobUrl: string;
        companyWebsite: string;
        requiredProfile: string;
        benefits: string;
        matchReason: string;
        notes: string;
        createdAt: string;
        updatedAt: string;
    };
    sheetName: string;
}

export async function exportToExcel(filePath: string, labels: ExportLabels): Promise<number> {
    const applications = listApplications();
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Simple Application Tracker';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(labels.sheetName);
    sheet.columns = [
        { header: labels.headers.status, key: 'status', width: 20 },
        { header: labels.headers.match, key: 'matchScore', width: 10 },
        { header: labels.headers.company, key: 'companyName', width: 28 },
        { header: labels.headers.jobTitle, key: 'jobTitle', width: 36 },
        { header: labels.headers.location, key: 'location', width: 18 },
        { header: labels.headers.remote, key: 'remote', width: 14 },
        { header: labels.headers.stack, key: 'stack', width: 40 },
        { header: labels.headers.salaryMin, key: 'salaryMin', width: 14 },
        { header: labels.headers.salaryMax, key: 'salaryMax', width: 14 },
        { header: labels.headers.currency, key: 'salaryCurrency', width: 10 },
        { header: labels.headers.priority, key: 'priority', width: 12 },
        { header: labels.headers.contactName, key: 'contactName', width: 22 },
        { header: labels.headers.contactEmail, key: 'contactEmail', width: 28 },
        { header: labels.headers.contactPhone, key: 'contactPhone', width: 18 },
        { header: labels.headers.tags, key: 'tags', width: 20 },
        { header: labels.headers.appliedAt, key: 'appliedAt', width: 14 },
        { header: labels.headers.source, key: 'source', width: 14 },
        { header: labels.headers.jobUrl, key: 'jobUrl', width: 50 },
        { header: labels.headers.companyWebsite, key: 'companyWebsite', width: 32 },
        { header: labels.headers.requiredProfile, key: 'requiredProfile', width: 50 },
        { header: labels.headers.benefits, key: 'benefits', width: 50 },
        { header: labels.headers.matchReason, key: 'matchReason', width: 50 },
        { header: labels.headers.notes, key: 'notes', width: 50 },
        { header: labels.headers.createdAt, key: 'createdAt', width: 14 },
        { header: labels.headers.updatedAt, key: 'updatedAt', width: 14 },
    ];

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFEEEEEE' },
    };

    for (const app of applications) {
        sheet.addRow({
            ...app,
            status: labels.status[app.status] ?? app.status,
            remote: labels.remote[app.remote] ?? app.remote,
            priority: labels.priority[app.priority] ?? app.priority,
            requiredProfile: app.requiredProfile.map((p) => `• ${p}`).join('\n'),
            benefits: app.benefits.map((b) => `• ${b}`).join('\n'),
            appliedAt: app.appliedAt ? formatDate(app.appliedAt) : '',
            createdAt: formatDate(app.createdAt),
            updatedAt: formatDate(app.updatedAt),
        });
    }

    await workbook.xlsx.writeFile(filePath);
    return applications.length;
}

function formatDate(d: Date | string): string {
    const date = typeof d === 'string' ? new Date(d) : d;
    return date.toLocaleDateString();
}
