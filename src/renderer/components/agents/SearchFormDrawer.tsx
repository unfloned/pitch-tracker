import {
    Button,
    Checkbox,
    Drawer,
    Group,
    NumberInput,
    ScrollArea,
    Select,
    Stack,
    Text,
    TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type {
    JobSource,
    ScheduleInterval,
    SerializedJobSearch,
} from '@shared/job-search';
import { SourceGrid } from '../SourceGrid';

interface FormValues {
    label: string;
    keywords: string;
    sources: JobSource[];
    locationFilter: string;
    remoteOnly: boolean;
    minSalary: number;
    enabled: boolean;
    interval: ScheduleInterval;
}

const DEFAULTS: FormValues = {
    label: 'TypeScript Remote',
    keywords: 'TypeScript',
    sources: ['germantechjobs', 'arbeitnow', 'remotive'],
    locationFilter: '',
    remoteOnly: true,
    minSalary: 0,
    enabled: true,
    interval: '6h',
};

interface Props {
    opened: boolean;
    onClose: () => void;
    initial: SerializedJobSearch | null;
    onSaved: () => void;
}

export function SearchFormDrawer({ opened, onClose, initial, onSaved }: Props) {
    const { t } = useTranslation();
    const form = useForm<FormValues>({ initialValues: DEFAULTS });

    useEffect(() => {
        if (!opened) return;
        if (initial) {
            form.setValues({
                label: initial.label,
                keywords: initial.keywords,
                sources: initial.sources,
                locationFilter: initial.locationFilter,
                remoteOnly: initial.remoteOnly,
                minSalary: initial.minSalary,
                enabled: initial.enabled,
                interval: initial.interval,
            });
        } else {
            form.setValues(DEFAULTS);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [opened, initial]);

    const submit = async (values: FormValues) => {
        if (values.sources.length === 0) {
            notifications.show({ color: 'yellow', message: t('searchForm.pickSourceHint') });
            return;
        }
        if (initial) {
            await window.api.agents.updateSearch(initial.id, values);
        } else {
            await window.api.agents.createSearch(values);
        }
        onSaved();
    };

    return (
        <Drawer
            opened={opened}
            onClose={onClose}
            position="right"
            size="md"
            title={initial ? t('searchForm.editTitle') : t('searchForm.newTitle')}
            scrollAreaComponent={ScrollArea.Autosize}
        >
            <form onSubmit={form.onSubmit(submit)}>
                <Stack gap="md">
                    <TextInput
                        label={t('searchForm.name')}
                        required
                        {...form.getInputProps('label')}
                    />
                    <Stack gap={6}>
                        <Text size="sm" fw={500}>
                            {t('searchForm.sources')}
                        </Text>
                        <Text size="xs" c="dimmed">
                            {t('searchForm.sourcesHint')}
                        </Text>
                        <SourceGrid
                            value={form.values.sources}
                            onChange={(v) => form.setFieldValue('sources', v)}
                        />
                    </Stack>
                    <TextInput
                        label={
                            form.values.sources.includes('url')
                                ? t('searchForm.keywordsOrUrl')
                                : t('searchForm.keywords')
                        }
                        placeholder={
                            form.values.sources.includes('url')
                                ? t('searchForm.keywordsUrlPlaceholder')
                                : t('searchForm.keywordsPlaceholder')
                        }
                        {...form.getInputProps('keywords')}
                    />
                    <Select
                        label={t('searchForm.intervalLabel')}
                        description={t('searchForm.intervalHint')}
                        data={[
                            { value: 'manual', label: t('interval.manual') },
                            { value: 'hourly', label: t('interval.hourly') },
                            { value: '3h', label: t('interval.3h') },
                            { value: '6h', label: t('interval.6h') },
                            { value: '12h', label: t('interval.12h') },
                            { value: 'daily', label: t('interval.daily') },
                        ]}
                        {...form.getInputProps('interval')}
                        allowDeselect={false}
                    />
                    <Checkbox
                        label={t('searchForm.remoteOnly')}
                        {...form.getInputProps('remoteOnly', { type: 'checkbox' })}
                    />
                    <NumberInput
                        label={t('searchForm.minSalary')}
                        min={0}
                        {...form.getInputProps('minSalary')}
                    />
                    <Checkbox
                        label={t('searchForm.activeLabel')}
                        {...form.getInputProps('enabled', { type: 'checkbox' })}
                    />
                    <Group justify="flex-end" mt="md">
                        <Button variant="subtle" onClick={onClose}>
                            {t('common.cancel')}
                        </Button>
                        <Button type="submit">
                            {initial ? t('common.save') : t('common.create')}
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Drawer>
    );
}
