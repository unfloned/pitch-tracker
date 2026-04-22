import { Accordion, Stack, Text, Textarea, TextInput } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { RichTextNotes } from '../../RichTextNotes';
import type { ApplicationForm } from '../types';

export function NotesSection({ form }: { form: ApplicationForm }) {
    const { t } = useTranslation();
    return (
        <Accordion.Item value="notes">
            <Accordion.Control>{t('form.descriptionAndNotes')}</Accordion.Control>
            <Accordion.Panel>
                <Stack gap="sm">
                    <Textarea
                        label={t('form.jobDescription')}
                        autosize
                        minRows={2}
                        maxRows={8}
                        {...form.getInputProps('jobDescription')}
                    />
                    <Stack gap={4}>
                        <Text size="sm" fw={500}>
                            {t('form.notes')}
                        </Text>
                        <RichTextNotes
                            value={form.values.notes}
                            onChange={(html) => form.setFieldValue('notes', html)}
                            minHeight={160}
                        />
                    </Stack>
                    <TextInput
                        label={t('form.tags')}
                        placeholder={t('form.tagsPlaceholder')}
                        {...form.getInputProps('tags')}
                    />
                </Stack>
            </Accordion.Panel>
        </Accordion.Item>
    );
}
