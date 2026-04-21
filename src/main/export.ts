import ExcelJS from 'exceljs';
import { listApplications } from './db';
import { PRIORITY_LABEL, REMOTE_LABEL, STATUS_LABEL } from '@shared/application';

export async function exportToExcel(filePath: string): Promise<number> {
    const applications = listApplications();
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Bewerbungen-Tracker';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Bewerbungen');
    sheet.columns = [
        { header: 'Status', key: 'status', width: 20 },
        { header: 'Passung', key: 'matchScore', width: 10 },
        { header: 'Firma', key: 'companyName', width: 28 },
        { header: 'Jobtitel', key: 'jobTitle', width: 36 },
        { header: 'Ort', key: 'location', width: 18 },
        { header: 'Remote', key: 'remote', width: 14 },
        { header: 'Stack', key: 'stack', width: 40 },
        { header: 'Gehalt Min', key: 'salaryMin', width: 14 },
        { header: 'Gehalt Max', key: 'salaryMax', width: 14 },
        { header: 'Währung', key: 'salaryCurrency', width: 10 },
        { header: 'Priorität', key: 'priority', width: 12 },
        { header: 'Kontakt', key: 'contactName', width: 22 },
        { header: 'E-Mail', key: 'contactEmail', width: 28 },
        { header: 'Telefon', key: 'contactPhone', width: 18 },
        { header: 'Tags', key: 'tags', width: 20 },
        { header: 'Beworben am', key: 'appliedAt', width: 14 },
        { header: 'Quelle', key: 'source', width: 14 },
        { header: 'Job-URL', key: 'jobUrl', width: 50 },
        { header: 'Firmen-Website', key: 'companyWebsite', width: 32 },
        { header: 'Anforderungen', key: 'requiredProfile', width: 50 },
        { header: 'Benefits', key: 'benefits', width: 50 },
        { header: 'Match-Begründung', key: 'matchReason', width: 50 },
        { header: 'Notizen', key: 'notes', width: 50 },
        { header: 'Erstellt am', key: 'createdAt', width: 14 },
        { header: 'Aktualisiert am', key: 'updatedAt', width: 14 },
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
            status: STATUS_LABEL[app.status],
            remote: REMOTE_LABEL[app.remote],
            priority: PRIORITY_LABEL[app.priority],
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
    return date.toLocaleDateString('de-DE');
}
