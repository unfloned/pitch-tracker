import { Checkbox, TextInput } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { Label } from '../primitives/Label';
import { RichTextNotes } from '../RichTextNotes';

interface Props {
    to: string;
    onTo: (v: string) => void;
    subject: string;
    onSubject: (v: string) => void;
    body: string;
    onBody: (v: string) => void;
    attachCv: boolean;
    onAttachCv: (v: boolean) => void;
}

export function EmailEditor({
    to,
    onTo,
    subject,
    onSubject,
    body,
    onBody,
    attachCv,
    onAttachCv,
}: Props) {
    const { t } = useTranslation();
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <TextInput
                label={t('email.to')}
                placeholder="contact@company.com"
                value={to}
                onChange={(e) => onTo(e.currentTarget.value)}
            />
            <TextInput
                label={t('email.subject')}
                value={subject}
                onChange={(e) => onSubject(e.currentTarget.value)}
            />
            <div>
                <Label>{t('email.body')}</Label>
                <div style={{ marginTop: 6 }}>
                    <RichTextNotes
                        value={body}
                        onChange={onBody}
                        minHeight={260}
                        placeholder={t('email.bodyPlaceholder')}
                    />
                </div>
            </div>
            <Checkbox
                label={t('email.attachCv')}
                checked={attachCv}
                onChange={(e) => onAttachCv(e.currentTarget.checked)}
            />
        </div>
    );
}
