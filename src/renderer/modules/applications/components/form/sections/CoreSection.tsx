import { Accordion, Select, SimpleGrid, Stack, TextInput } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { RemoteType } from '@shared/application';
import type { ApplicationForm } from '../types';

export function CoreSection({ form }: { form: ApplicationForm }) {
    const { t } = useTranslation();
    return (
        <Accordion.Item value="core">
            <Accordion.Control>{t('form.companyAndJob')}</Accordion.Control>
            <Accordion.Panel>
                <Stack gap="sm">
                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                        <TextInput
                            label={t('form.company')}
                            {...form.getInputProps('companyName')}
                        />
                        <TextInput
                            label={t('form.companyWebsite')}
                            placeholder="https://..."
                            {...form.getInputProps('companyWebsite')}
                        />
                        <TextInput
                            label={t('form.jobTitle')}
                            {...form.getInputProps('jobTitle')}
                        />
                        <TextInput
                            label={t('form.location')}
                            placeholder={t('form.locationPlaceholder')}
                            {...form.getInputProps('location')}
                        />
                        <Select
                            label={t('form.remoteType')}
                            data={(['onsite', 'hybrid', 'remote'] as RemoteType[]).map((v) => ({
                                value: v,
                                label: t(`remote.${v}`),
                            }))}
                            {...form.getInputProps('remote')}
                        />
                        <TextInput
                            label={t('form.source')}
                            {...form.getInputProps('source')}
                        />
                    </SimpleGrid>
                    <TextInput
                        label={t('form.stack')}
                        placeholder={t('form.stackPlaceholder')}
                        {...form.getInputProps('stack')}
                    />
                </Stack>
            </Accordion.Panel>
        </Accordion.Item>
    );
}
