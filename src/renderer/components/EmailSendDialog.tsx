import {
    Alert,
    Button,
    Checkbox,
    Drawer,
    Group,
    ScrollArea,
    Stack,
    Text,
    TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
    IconAlertCircle,
    IconCheck,
    IconSend,
    IconSparkles,
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RichTextNotes } from './RichTextNotes';
import type { ApplicationRecord } from '../../preload/index';

interface Props {
    opened: boolean;
    onClose: () => void;
    application: ApplicationRecord | null;
}

function renderTemplate(raw: string, vars: Record<string, string>): string {
    return raw.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => vars[key] ?? '');
}

const DEFAULT_TEMPLATE = `<p>Guten Tag{{greeting}},</p>
<p>ich möchte mich auf die Position <b>{{jobTitle}}</b> bei <b>{{company}}</b> bewerben.</p>
<p>Im Anhang finden Sie meinen Lebenslauf. Ich freue mich auf Ihre Rückmeldung.</p>
<p>Mit freundlichen Grüßen<br/>{{name}}</p>
{{signature}}`;

export function EmailSendDialog({ opened, onClose, application }: Props) {
    const { t } = useTranslation();
    const [to, setTo] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [attachCv, setAttachCv] = useState(true);
    const [sending, setSending] = useState(false);
    const [smtpOk, setSmtpOk] = useState<boolean | null>(null);
    const [profileSet, setProfileSet] = useState<boolean | null>(null);

    useEffect(() => {
        if (!opened || !application) return;
        window.api.profile.get().then((p) => {
            const configured = Boolean(p.smtpHost && p.smtpUser);
            setProfileSet(configured);

            const vars: Record<string, string> = {
                company: application.companyName || '',
                jobTitle: application.jobTitle || '',
                contactName: application.contactName || '',
                greeting: application.contactName ? ` ${application.contactName}` : '',
                name: p.fullName || '',
                signature: p.signature ? `<p>${p.signature.replace(/\n/g, '<br/>')}</p>` : '',
            };

            setTo(application.contactEmail || '');
            setSubject(
                `Bewerbung: ${application.jobTitle || ''}${
                    application.companyName ? ' - ' + application.companyName : ''
                }`.trim(),
            );
            setBody(renderTemplate(DEFAULT_TEMPLATE, vars));
            setAttachCv(Boolean(p.cvPath));
        });
        window.api.email
            .verify()
            .then((r) => setSmtpOk(r.ok))
            .catch(() => setSmtpOk(false));
    }, [opened, application]);

    const send = async () => {
        setSending(true);
        const result = await window.api.email.send({ to, subject, body, attachCv });
        setSending(false);
        if (result.ok) {
            notifications.show({
                color: 'green',
                icon: <IconCheck size={16} />,
                message: t('email.sentOk'),
            });
            onClose();
        } else {
            notifications.show({
                color: 'red',
                icon: <IconAlertCircle size={16} />,
                title: t('email.sendFailed'),
                message: result.error ?? 'Unknown error',
                autoClose: 10000,
            });
        }
    };

    return (
        <Drawer
            opened={opened}
            onClose={onClose}
            position="right"
            size="lg"
            title={
                <Group gap="xs">
                    <IconSend size={18} />
                    <Text fw={600}>{t('email.title')}</Text>
                </Group>
            }
            scrollAreaComponent={ScrollArea.Autosize}
        >
            {profileSet === false && (
                <Alert variant="light" color="yellow" icon={<IconAlertCircle size={16} />} mb="md">
                    {t('email.smtpNotConfigured')}
                </Alert>
            )}
            {profileSet === true && smtpOk === false && (
                <Alert variant="light" color="red" icon={<IconAlertCircle size={16} />} mb="md">
                    {t('email.smtpVerifyFailed')}
                </Alert>
            )}

            <Alert variant="light" color="accent" icon={<IconSparkles size={16} />} mb="md">
                {t('email.templateHint')}
            </Alert>

            <Stack gap="md">
                <TextInput
                    label={t('email.to')}
                    placeholder="contact@company.com"
                    value={to}
                    onChange={(e) => setTo(e.currentTarget.value)}
                />
                <TextInput
                    label={t('email.subject')}
                    value={subject}
                    onChange={(e) => setSubject(e.currentTarget.value)}
                />
                <Stack gap={4}>
                    <Text size="sm" fw={500}>
                        {t('email.body')}
                    </Text>
                    <RichTextNotes
                        value={body}
                        onChange={setBody}
                        minHeight={260}
                        placeholder={t('email.bodyPlaceholder')}
                    />
                </Stack>
                <Checkbox
                    label={t('email.attachCv')}
                    checked={attachCv}
                    onChange={(e) => setAttachCv(e.currentTarget.checked)}
                />
                <Group justify="flex-end" mt="md">
                    <Button variant="subtle" onClick={onClose}>
                        {t('common.cancel')}
                    </Button>
                    <Button
                        leftSection={<IconSend size={16} />}
                        onClick={send}
                        loading={sending}
                        disabled={!to || !subject || !profileSet}
                    >
                        {t('email.send')}
                    </Button>
                </Group>
            </Stack>
        </Drawer>
    );
}
