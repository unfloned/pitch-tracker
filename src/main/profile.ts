import { safeStorage } from 'electron';
import Store from 'electron-store';

export interface UserProfile {
    fullName: string;
    email: string;
    phone: string;
    signature: string;
    cvPath: string;
    smtpHost: string;
    smtpPort: number;
    smtpSecure: boolean;
    smtpUser: string;
    smtpPassword: string;
    smtpFromName: string;
}

interface StoredProfile extends Omit<UserProfile, 'smtpPassword'> {
    smtpPasswordEnc: string;
}

const ENC_PREFIX = 'enc:v1:';

function encryptPassword(plain: string): string {
    if (!plain) return '';
    try {
        if (safeStorage.isEncryptionAvailable()) {
            const buf = safeStorage.encryptString(plain);
            return ENC_PREFIX + buf.toString('base64');
        }
    } catch (err) {
        console.warn('[profile] encryptString failed:', (err as Error).message);
    }
    return plain;
}

function decryptPassword(stored: string): string {
    if (!stored) return '';
    if (!stored.startsWith(ENC_PREFIX)) return stored;
    try {
        const buf = Buffer.from(stored.slice(ENC_PREFIX.length), 'base64');
        return safeStorage.decryptString(buf);
    } catch (err) {
        console.warn('[profile] decryptString failed:', (err as Error).message);
        return '';
    }
}

const store = new Store<StoredProfile>({
    name: 'user-profile',
    defaults: {
        fullName: '',
        email: '',
        phone: '',
        signature: '',
        cvPath: '',
        smtpHost: '',
        smtpPort: 587,
        smtpSecure: false,
        smtpUser: '',
        smtpPasswordEnc: '',
        smtpFromName: '',
    },
});

migrateLegacyPassword();

function migrateLegacyPassword(): void {
    const legacy = (store as unknown as { get(k: string): unknown }).get('smtpPassword') as
        | string
        | undefined;
    if (legacy && typeof legacy === 'string') {
        if (!store.get('smtpPasswordEnc')) {
            store.set('smtpPasswordEnc', encryptPassword(legacy));
        }
        (store as unknown as { delete(k: string): void }).delete('smtpPassword');
    }
}

export function getUserProfile(): UserProfile {
    return {
        fullName: store.get('fullName'),
        email: store.get('email'),
        phone: store.get('phone'),
        signature: store.get('signature'),
        cvPath: store.get('cvPath'),
        smtpHost: store.get('smtpHost'),
        smtpPort: store.get('smtpPort'),
        smtpSecure: store.get('smtpSecure'),
        smtpUser: store.get('smtpUser'),
        smtpPassword: decryptPassword(store.get('smtpPasswordEnc') as string),
        smtpFromName: store.get('smtpFromName'),
    };
}

export function setUserProfile(profile: Partial<UserProfile>): UserProfile {
    for (const key of Object.keys(profile) as (keyof UserProfile)[]) {
        const value = profile[key];
        if (value === undefined) continue;
        if (key === 'smtpPassword') {
            store.set('smtpPasswordEnc', encryptPassword(String(value)));
        } else {
            store.set(key as keyof StoredProfile, value as never);
        }
    }
    return getUserProfile();
}

export function isSmtpEncryptionAvailable(): boolean {
    try {
        return safeStorage.isEncryptionAvailable();
    } catch {
        return false;
    }
}
