import { Accordion, SimpleGrid, TextInput } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { ApplicationForm } from '../types';

export function ContactSection({ form }: { form: ApplicationForm }) {
    const { t } = useTranslation();
    return (
        <Accordion.Item value="contact">
            <Accordion.Control>{t('form.contact')}</Accordion.Control>
            <Accordion.Panel>
                <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
                    <TextInput
                        label={t('form.contactName')}
                        {...form.getInputProps('contactName')}
                    />
                    <TextInput
                        label={t('form.contactEmail')}
                        {...form.getInputProps('contactEmail')}
                    />
                    <TextInput
                        label={t('form.contactPhone')}
                        {...form.getInputProps('contactPhone')}
                    />
                </SimpleGrid>
            </Accordion.Panel>
        </Accordion.Item>
    );
}
