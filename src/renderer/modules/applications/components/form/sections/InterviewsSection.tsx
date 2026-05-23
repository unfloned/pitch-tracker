import { Accordion, Badge, Group, TagsInput, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { ApplicationForm } from '../types';

export function InterviewsSection({ form }: { form: ApplicationForm }) {
    const { t } = useTranslation();
    return (
        <Accordion.Item value="interviews">
            <Accordion.Control>
                <Group gap="xs">
                    <Text>{t('form.interviews')}</Text>
                    {form.values.interviews.length > 0 && (
                        <Badge size="xs" variant="light">
                            {form.values.interviews.length}
                        </Badge>
                    )}
                </Group>
            </Accordion.Control>
            <Accordion.Panel>
                <TagsInput
                    label={t('form.interviews')}
                    description={t('form.interviewsHint')}
                    placeholder={t('form.interviewsPlaceholder')}
                    {...form.getInputProps('interviews')}
                    clearable
                    splitChars={[';']}
                />
            </Accordion.Panel>
        </Accordion.Item>
    );
}
