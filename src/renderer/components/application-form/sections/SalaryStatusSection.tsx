import { Accordion, NumberInput, Select, SimpleGrid, Stack, Text, TextInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useTranslation } from 'react-i18next';
import type { Priority } from '@shared/application';
import { StatusSelector } from '../../StatusSelector';
import type { ApplicationForm } from '../types';

export function SalaryStatusSection({ form }: { form: ApplicationForm }) {
    const { t } = useTranslation();
    return (
        <Accordion.Item value="salary">
            <Accordion.Control>{t('form.salaryAndStatus')}</Accordion.Control>
            <Accordion.Panel>
                <Stack gap="sm">
                    <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
                        <NumberInput
                            label={t('form.salaryMin')}
                            min={0}
                            {...form.getInputProps('salaryMin')}
                        />
                        <NumberInput
                            label={t('form.salaryMax')}
                            min={0}
                            {...form.getInputProps('salaryMax')}
                        />
                        <TextInput
                            label={t('form.currency')}
                            maxLength={3}
                            {...form.getInputProps('salaryCurrency')}
                        />
                        <Select
                            label={t('form.priority')}
                            data={(['low', 'medium', 'high'] as Priority[]).map((v) => ({
                                value: v,
                                label: t(`priority.${v}`),
                            }))}
                            {...form.getInputProps('priority')}
                        />
                    </SimpleGrid>
                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                        <Stack gap={4}>
                            <Text size="sm" fw={500}>
                                {t('form.statusLabel')}
                            </Text>
                            <div>
                                <StatusSelector
                                    value={form.values.status}
                                    onChange={(s) => form.setFieldValue('status', s)}
                                />
                            </div>
                        </Stack>
                        <DateInput
                            label={t('form.appliedAt')}
                            clearable
                            valueFormat="DD.MM.YYYY"
                            {...form.getInputProps('appliedAt')}
                        />
                    </SimpleGrid>
                </Stack>
            </Accordion.Panel>
        </Accordion.Item>
    );
}
