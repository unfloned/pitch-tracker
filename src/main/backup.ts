import { app } from 'electron';
import AdmZip from 'adm-zip';
import {
    existsSync,
    mkdirSync,
    readdirSync,
    readFileSync,
    writeFileSync,
    copyFileSync,
} from 'node:fs';
import { join } from 'node:path';

export interface BackupResult {
    ok: boolean;
    filePath?: string;
    size?: number;
    error?: string;
}

export interface RestoreResult {
    ok: boolean;
    restoredFiles?: number;
    error?: string;
}

const BACKUP_FILES = [
    'tracker.sqlite',
    'agents.sqlite',
    'config.json',
    'agent-profile.json',
    'user-profile.json',
];

export function createBackup(filePath: string): BackupResult {
    try {
        const userDataPath = app.getPath('userData');
        const zip = new AdmZip();

        const files = readdirSync(userDataPath);
        let count = 0;
        for (const f of files) {
            if (!BACKUP_FILES.includes(f)) continue;
            const full = join(userDataPath, f);
            if (existsSync(full)) {
                zip.addLocalFile(full);
                count += 1;
            }
        }

        const cvDir = join(userDataPath, 'cv');
        if (existsSync(cvDir)) {
            zip.addLocalFolder(cvDir, 'cv');
            count += 1;
        }

        const manifest = {
            createdAt: new Date().toISOString(),
            appVersion: app.getVersion(),
            fileCount: count,
            files: BACKUP_FILES,
        };
        zip.addFile('manifest.json', Buffer.from(JSON.stringify(manifest, null, 2)));

        zip.writeZip(filePath);
        const buf = readFileSync(filePath);
        return { ok: true, filePath, size: buf.length };
    } catch (err) {
        return { ok: false, error: (err as Error).message };
    }
}

export function restoreBackup(filePath: string): RestoreResult {
    try {
        if (!existsSync(filePath)) return { ok: false, error: 'Backup file not found' };
        const userDataPath = app.getPath('userData');
        const zip = new AdmZip(filePath);
        const entries = zip.getEntries();

        let restored = 0;
        for (const entry of entries) {
            const name = entry.entryName;
            if (name === 'manifest.json') continue;
            if (entry.isDirectory) continue;
            if (BACKUP_FILES.includes(name)) {
                writeFileSync(join(userDataPath, name), entry.getData());
                restored += 1;
            } else if (name.startsWith('cv/')) {
                const target = join(userDataPath, name);
                const targetDir = target.substring(0, target.lastIndexOf('/'));
                if (!existsSync(targetDir)) {
                    mkdirSync(targetDir, { recursive: true });
                }
                writeFileSync(target, entry.getData());
                restored += 1;
            }
        }

        return { ok: true, restoredFiles: restored };
    } catch (err) {
        return { ok: false, error: (err as Error).message };
    }
}
