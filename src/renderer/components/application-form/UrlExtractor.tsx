import { Alert, Button, Group, TextInput, Tooltip } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconSparkles } from '@tabler/icons-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ApplicationForm } from './types';

interface Props {
    form: ApplicationForm;
}

/**
 * Paste a job URL and hit "Auto-Fill" - backend scrapes + LLM-extracts the
 * posting and fills structured fields in one shot. Leaves untouched fields
 * at their existing values (spread with `v`).
 */
export function UrlExtractor({ form }: Props) {
    const { t } = useTranslation();
    const [extracting, setExtracting] = useState(false);

    const doExtract = async () => {
        const url = form.values.jobUrl.trim();
        if (!url) {
            notifications.show({ color: 'yellow', message: t('notifications.enterUrlFirst') });
            return;
        }
        setExtracting(true);
        try {
            const data = await window.api.llm.extract(url);
            form.setValues((v) => ({
                ...v,
                companyName: data.companyName || v.companyName,
                jobTitle: data.jobTitle || v.jobTitle,
                location: data.location || v.location,
                remote: data.remote || v.remote,
                salaryMin: data.salaryMin || v.salaryMin,
                salaryMax: data.salaryMax || v.salaryMax,
                stack: data.stack || v.stack,
                jobDescription: data.jobDescription || v.jobDescription,
                requiredProfile: data.requiredProfile.length
                    ? data.requiredProfile
                    : v.requiredProfile,
                benefits: data.benefits.length ? data.benefits : v.benefits,
                source: data.source || v.source,
            }));
            notifications.show({ color: 'green', message: t('notifications.dataExtracted') });
        } catch (err) {
            notifications.show({
                color: 'red',
                title: t('notifications.extractFailed'),
                message: (err as Error).message,
                icon: <IconAlertCircle size={16} />,
                autoClose: 8000,
            });
        } finally {
            setExtracting(false);
        }
    };

    return (
        <>
            <Alert variant="light" color="accent" icon={<IconSparkles size={16} />}>
                {t('form.autoFillHint')}
            </Alert>
            <Group align="end">
                <TextInput
                    label={t('form.jobUrl')}
                    placeholder="https://..."
                    flex={1}
                    {...form.getInputProps('jobUrl')}
                />
                <Tooltip label={t('form.autoFillTooltip')}>
                    <Button
                        loading={extracting}
                        onClick={doExtract}
                        leftSection={<IconSparkles size={16} />}
                        variant="light"
                    >
                        {t('form.autoFill')}
                    </Button>
                </Tooltip>
            </Group>
        </>
    );
}
