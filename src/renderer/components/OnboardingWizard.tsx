import {
    Alert,
    Badge,
    Button,
    Checkbox,
    Code,
    Drawer,
    Group,
    NumberInput,
    ScrollArea,
    Stack,
    Stepper,
    Switch,
    TagsInput,
    Text,
    Title,
} from '@mantine/core';
import { IconInfoCircle, IconSparkles, IconTargetArrow } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AgentProfile } from '../../preload/index';

interface Props {
    opened: boolean;
    onClose: () => void;
}

export function OnboardingWizard({ opened, onClose }: Props) {
    const { t } = useTranslation();
    const [step, setStep] = useState(0);
    const [profile, setProfile] = useState<AgentProfile | null>(null);
    const [stackTags, setStackTags] = useState<string[]>([
        'TypeScript',
        'Next.js',
        'React Native',
    ]);
    const [antiTags, setAntiTags] = useState<string[]>(['Java-only', 'PHP-only']);
    const [remote, setRemote] = useState(true);
    const [salary, setSalary] = useState(60000);
    const [llmStatus, setLlmStatus] = useState<{ running: boolean; models: string[] } | null>(null);

    useEffect(() => {
        if (!opened) return;
        setStep(0);
        window.api.agents.getProfile().then((p) => setProfile(p));
        window.api.llm.status().then((s) => setLlmStatus({ running: s.running, models: s.models }));
    }, [opened]);

    const saveProfileStep = async () => {
        await window.api.agents.setProfile({
            stackKeywords: stackTags.join(', '),
            antiStack: antiTags.join(', '),
            remotePreferred: remote,
            minSalary: salary,
            autoImportThreshold: profile?.autoImportThreshold ?? 0,
        });
    };

    const next = async () => {
        if (step === 1) await saveProfileStep();
        setStep((s) => Math.min(s + 1, 3));
    };
    const back = () => setStep((s) => Math.max(s - 1, 0));

    const finish = () => {
        onClose();
    };

    return (
        <Drawer
            opened={opened}
            onClose={onClose}
            position="right"
            size="lg"
            title={t('onboarding.welcomeTitle')}
            scrollAreaComponent={ScrollArea.Autosize}
            closeOnClickOutside={false}
            closeOnEscape={false}
        >
            <Stack gap="lg">
                <Stepper active={step} size="sm">
                    <Stepper.Step label={t('onboarding.step1Title')} />
                    <Stepper.Step label={t('onboarding.step2Title')} />
                    <Stepper.Step label={t('onboarding.step3Title')} />
                    <Stepper.Step label={t('onboarding.step4Title')} />
                </Stepper>

                {step === 0 && (
                    <Stack gap="md">
                        <Title order={4}>{t('onboarding.welcomeTitle')}</Title>
                        <Text>{t('onboarding.welcomeBody')}</Text>
                    </Stack>
                )}

                {step === 1 && (
                    <Stack gap="md">
                        <Title order={5}>{t('onboarding.step1Title')}</Title>
                        <Text size="sm" c="dimmed">
                            {t('onboarding.step1Body')}
                        </Text>
                        <TagsInput
                            label={t('profileDrawer.desiredStack')}
                            placeholder={t('profileDrawer.desiredStackPlaceholder')}
                            value={stackTags}
                            onChange={setStackTags}
                            splitChars={[',', ';']}
                        />
                        <TagsInput
                            label={t('profileDrawer.antiStack')}
                            placeholder={t('profileDrawer.antiStackPlaceholder')}
                            value={antiTags}
                            onChange={setAntiTags}
                            splitChars={[',', ';']}
                        />
                        <Checkbox
                            label={t('profileDrawer.preferRemote')}
                            checked={remote}
                            onChange={(e) => setRemote(e.currentTarget.checked)}
                        />
                        <NumberInput
                            label={t('profileDrawer.minSalary')}
                            min={0}
                            step={5000}
                            value={salary}
                            onChange={(v) => setSalary(Number(v) || 0)}
                        />
                    </Stack>
                )}

                {step === 2 && (
                    <Stack gap="md">
                        <Title order={5}>{t('onboarding.step2Title')}</Title>
                        <Text size="sm" c="dimmed">
                            {t('onboarding.step2Body')}
                        </Text>
                        {llmStatus === null ? null : llmStatus.running ? (
                            <Alert color="green" icon={<IconSparkles size={16} />}>
                                {t('settings.statusRunning')} - {llmStatus.models.length > 0 ? llmStatus.models.join(', ') : 'no model yet'}
                            </Alert>
                        ) : (
                            <Alert color="yellow" icon={<IconInfoCircle size={16} />}>
                                <Stack gap={4}>
                                    <Text size="sm">{t('settings.statusOffline')}</Text>
                                    <Code>brew install ollama && ollama serve</Code>
                                    <Code>ollama pull llama3.2:3b</Code>
                                </Stack>
                            </Alert>
                        )}
                    </Stack>
                )}

                {step === 3 && (
                    <Stack gap="md">
                        <Title order={5}>{t('onboarding.step4Title')}</Title>
                        <Text>{t('onboarding.step4Body')}</Text>
                        <Group gap="xs">
                            <Badge variant="light" leftSection={<IconTargetArrow size={10} />}>
                                Cmd+N
                            </Badge>
                            <Badge variant="light">Cmd+Shift+N</Badge>
                            <Badge variant="light">Cmd+F</Badge>
                            <Badge variant="light">Cmd+E</Badge>
                            <Badge variant="light">Cmd+,</Badge>
                        </Group>
                    </Stack>
                )}

                <Group justify="space-between" mt="md">
                    <Button variant="subtle" onClick={onClose}>
                        {t('onboarding.skip')}
                    </Button>
                    <Group>
                        {step > 0 && step < 3 && (
                            <Button variant="subtle" onClick={back}>
                                {t('onboarding.back')}
                            </Button>
                        )}
                        {step < 3 ? (
                            <Button onClick={next}>{t('onboarding.next')}</Button>
                        ) : (
                            <Button onClick={finish}>{t('onboarding.finish')}</Button>
                        )}
                    </Group>
                </Group>
            </Stack>
        </Drawer>
    );
}
