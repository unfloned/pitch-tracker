import { Accordion, Stack, TagsInput } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { ApplicationForm } from '../types';

export function RequirementsSection({ form }: { form: ApplicationForm }) {
    const { t } = useTranslation();
    return (
        <Accordion.Item value="requirements">
            <Accordion.Control>{t('form.requirementsAndBenefits')}</Accordion.Control>
            <Accordion.Panel>
                <Stack gap="sm">
                    <TagsInput
                        label={t('form.requiredProfile')}
                        description={t('form.requiredProfileHint')}
                        placeholder={t('form.requiredProfilePlaceholder')}
                        {...form.getInputProps('requiredProfile')}
                        clearable
                        splitChars={[',', ';']}
                    />
                    <TagsInput
                        label={t('form.benefits')}
                        description={t('form.benefitsHint')}
                        placeholder={t('form.benefitsPlaceholder')}
                        {...form.getInputProps('benefits')}
                        clearable
                        splitChars={[',', ';']}
                    />
                </Stack>
            </Accordion.Panel>
        </Accordion.Item>
    );
}
