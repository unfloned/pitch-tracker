import { SimpleGrid, Textarea, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { UserProfileDto } from '../../../../preload/index';
import { GhostBtn } from '../../../components/primitives/GhostBtn';
import { SettingsSection } from './SettingsSection';

export function ProfileCard() {
    const { t } = useTranslation();
    const [profile, setProfile] = useState<UserProfileDto | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        window.api.profile.get().then(setProfile);
    }, []);

    const updateProfile = <K extends keyof UserProfileDto>(key: K, value: UserProfileDto[K]) => {
        setProfile((prev) => (prev ? { ...prev, [key]: value } : prev));
    };

    const saveProfile = async () => {
        if (!profile) return;
        setSaving(true);
        try {
            const next = await window.api.profile.set(profile);
            setProfile(next);
            notifications.show({ color: 'green', message: t('profilePage.saved') });
        } finally {
            setSaving(false);
        }
    };

    const pickCv = async () => {
        const result = await window.api.profile.pickCv();
        if (result.canceled || !result.path || !profile) return;
        const next = await window.api.profile.set({ cvPath: result.path });
        setProfile(next);
    };

    if (!profile) return null;

    return (
        <SettingsSection label={t('profilePage.section')}>
            <SimpleGrid cols={2} spacing="sm">
                <TextInput
                    label={t('profilePage.fullName')}
                    value={profile.fullName}
                    onChange={(e) => updateProfile('fullName', e.currentTarget.value)}
                />
                <TextInput
                    label={t('profilePage.email')}
                    value={profile.email}
                    onChange={(e) => updateProfile('email', e.currentTarget.value)}
                />
                <TextInput
                    label={t('profilePage.phone')}
                    value={profile.phone}
                    onChange={(e) => updateProfile('phone', e.currentTarget.value)}
                />
            </SimpleGrid>
            <div style={{ marginTop: 12 }}>
                <Textarea
                    label={t('profilePage.signature')}
                    placeholder={t('profilePage.signaturePlaceholder')}
                    autosize
                    minRows={2}
                    maxRows={6}
                    value={profile.signature}
                    onChange={(e) => updateProfile('signature', e.currentTarget.value)}
                />
            </div>
            <div style={{ marginTop: 16 }}>
                <div
                    style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: 'var(--ink)',
                        marginBottom: 6,
                    }}
                >
                    {t('profilePage.cv')}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <GhostBtn onClick={pickCv}>
                        <span>{t('profilePage.pickCv')}</span>
                    </GhostBtn>
                    <span
                        className="mono"
                        style={{
                            fontSize: 11,
                            color: profile.cvPath ? 'var(--ink-3)' : 'var(--ink-4)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            flex: 1,
                            minWidth: 0,
                        }}
                    >
                        {profile.cvPath || t('profilePage.cvNone')}
                    </span>
                </div>
            </div>
            <div style={{ marginTop: 20 }}>
                <GhostBtn
                    active
                    onClick={saveProfile}
                    disabled={saving}
                    style={{
                        background: 'var(--ink)',
                        color: 'var(--paper)',
                        borderColor: 'var(--ink)',
                    }}
                >
                    <span>
                        {saving ? t('common.saving', 'Saving…') : t('profilePage.save')}
                    </span>
                </GhostBtn>
            </div>
        </SettingsSection>
    );
}
