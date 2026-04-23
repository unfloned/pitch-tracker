import {
    Button,
    Center,
    Checkbox,
    Divider,
    Drawer,
    Group,
    Loader,
    NumberInput,
    ScrollArea,
    Stack,
    Switch,
    TagsInput,
    Text,
    Textarea,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AgentProfile } from '../../../preload/index';

function splitToList(raw: string): string[] {
    return raw
        .split(/[,;]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
}

interface Props {
    opened: boolean;
    onClose: () => void;
}

export function AgentProfileDrawer({ opened, onClose }: Props) {
    const { t } = useTranslation();
    const [profile, setProfile] = useState<AgentProfile | null>(null);
    const [stackTags, setStackTags] = useState<string[]>([]);
    const [antiTags, setAntiTags] = useState<string[]>([]);
    const [excludeTags, setExcludeTags] = useState<string[]>([]);
    const [llmInstruction, setLlmInstruction] = useState('');
    const [salaryEnabled, setSalaryEnabled] = useState(false);
    const [autoImportEnabled, setAutoImportEnabled] = useState(false);
    const [salaryValue, setSalaryValue] = useState(60000);
    const [autoImportValue, setAutoImportValue] = useState(85);

    useEffect(() => {
        if (!opened) return;
        window.api.agents.getProfile().then((p) => {
            setProfile(p);
            setStackTags(splitToList(p.stackKeywords));
            setAntiTags(splitToList(p.antiStack));
            setExcludeTags(Array.isArray(p.excludes) ? p.excludes : []);
            setLlmInstruction(p.llmInstruction ?? '');
            setSalaryEnabled(p.minSalary > 0);
            setSalaryValue(p.minSalary > 0 ? p.minSalary : 60000);
            setAutoImportEnabled(p.autoImportThreshold > 0);
            setAutoImportValue(p.autoImportThreshold > 0 ? p.autoImportThreshold : 85);
        });
    }, [opened]);

    const save = async () => {
        if (!profile) return;
        await window.api.agents.setProfile({
            ...profile,
            stackKeywords: stackTags.join(', '),
            antiStack: antiTags.join(', '),
            excludes: excludeTags,
            llmInstruction,
            minSalary: salaryEnabled ? salaryValue : 0,
            autoImportThreshold: autoImportEnabled ? autoImportValue : 0,
        });
        notifications.show({ color: 'green', message: t('notifications.profileSaved') });
        onClose();
    };

    return (
        <Drawer
            opened={opened}
            onClose={onClose}
            position="right"
            size="md"
            title={t('profileDrawer.title')}
            scrollAreaComponent={ScrollArea.Autosize}
        >
            {profile ? (
                <Stack gap="md">
                    <Text size="sm" c="dimmed">
                        {t('profileDrawer.intro')}
                    </Text>

                    <Divider label={t('profileDrawer.techPreferences')} labelPosition="left" />
                    <TagsInput
                        label={t('profileDrawer.desiredStack')}
                        description={t('profileDrawer.desiredStackHint')}
                        placeholder={t('profileDrawer.desiredStackPlaceholder')}
                        value={stackTags}
                        onChange={setStackTags}
                        splitChars={[',', ';']}
                        clearable
                    />
                    <TagsInput
                        label={t('profileDrawer.antiStack')}
                        description={t('profileDrawer.antiStackHint')}
                        placeholder={t('profileDrawer.antiStackPlaceholder')}
                        value={antiTags}
                        onChange={setAntiTags}
                        splitChars={[',', ';']}
                        clearable
                    />

                    <Divider label={t('profileDrawer.llmControl')} labelPosition="left" />
                    <TagsInput
                        label={t('profileDrawer.hardExcludes')}
                        description={t('profileDrawer.hardExcludesHint')}
                        placeholder={t('profileDrawer.hardExcludesPlaceholder')}
                        value={excludeTags}
                        onChange={setExcludeTags}
                        splitChars={[';']}
                        clearable
                    />
                    <Textarea
                        label={t('profileDrawer.llmInstruction')}
                        description={t('profileDrawer.llmInstructionHint')}
                        placeholder={t('profileDrawer.llmInstructionPlaceholder')}
                        value={llmInstruction}
                        onChange={(e) => setLlmInstruction(e.currentTarget.value)}
                        autosize
                        minRows={3}
                        maxRows={8}
                    />

                    <Divider label={t('profileDrawer.workPreferences')} labelPosition="left" />
                    <Checkbox
                        label={t('profileDrawer.preferRemote')}
                        description={t('profileDrawer.preferRemoteHint')}
                        checked={profile.remotePreferred}
                        onChange={(e) =>
                            setProfile({ ...profile, remotePreferred: e.currentTarget.checked })
                        }
                    />
                    <Group justify="space-between" align="center">
                        <div style={{ flex: 1 }}>
                            <Text size="sm" fw={500}>
                                {t('profileDrawer.minSalaryToggle')}
                            </Text>
                            <Text size="xs" c="dimmed">
                                {t('profileDrawer.minSalaryToggleHint')}
                            </Text>
                        </div>
                        <Switch
                            checked={salaryEnabled}
                            onChange={(e) => setSalaryEnabled(e.currentTarget.checked)}
                        />
                    </Group>
                    {salaryEnabled && (
                        <NumberInput
                            label={t('profileDrawer.minSalary')}
                            min={0}
                            step={5000}
                            value={salaryValue}
                            onChange={(v) => setSalaryValue(Number(v) || 0)}
                        />
                    )}

                    <Divider label={t('profileDrawer.automation')} labelPosition="left" />
                    <Group justify="space-between" align="center">
                        <div style={{ flex: 1 }}>
                            <Text size="sm" fw={500}>
                                {t('profileDrawer.autoImportToggle')}
                            </Text>
                            <Text size="xs" c="dimmed">
                                {t('profileDrawer.autoImportToggleHint')}
                            </Text>
                        </div>
                        <Switch
                            checked={autoImportEnabled}
                            onChange={(e) => setAutoImportEnabled(e.currentTarget.checked)}
                        />
                    </Group>
                    {autoImportEnabled && (
                        <NumberInput
                            label={t('profileDrawer.autoImportThreshold')}
                            description={t('profileDrawer.autoImportHint')}
                            min={1}
                            max={100}
                            step={5}
                            value={autoImportValue}
                            onChange={(v) => setAutoImportValue(Number(v) || 1)}
                        />
                    )}

                    <Group justify="flex-end" mt="md">
                        <Button variant="subtle" onClick={onClose}>
                            {t('common.cancel')}
                        </Button>
                        <Button onClick={save}>{t('profileDrawer.saveProfile')}</Button>
                    </Group>
                </Stack>
            ) : (
                <Center py="xl">
                    <Loader />
                </Center>
            )}
        </Drawer>
    );
}
