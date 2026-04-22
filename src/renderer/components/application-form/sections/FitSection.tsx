import { Accordion, Alert, Button, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconTargetArrow } from '@tabler/icons-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ApplicationForm } from '../types';
import { scoreColor } from '../utils';

export function FitSection({ form }: { form: ApplicationForm }) {
    const { t } = useTranslation();
    const [assessing, setAssessing] = useState(false);

    const doAssessFit = async () => {
        setAssessing(true);
        try {
            const result = await window.api.llm.assessFit(form.values);
            form.setFieldValue('matchScore', result.score);
            form.setFieldValue('matchReason', result.reason);
            notifications.show({
                color: scoreColor(result.score),
                title: t('form.fitCheckTitle', { score: result.score }),
                message: result.reason,
                icon: <IconTargetArrow size={16} />,
                autoClose: 8000,
            });
        } catch (err) {
            notifications.show({
                color: 'red',
                title: t('notifications.fitCheckFailed'),
                message: (err as Error).message,
                autoClose: 8000,
            });
        } finally {
            setAssessing(false);
        }
    };

    return (
        <Accordion.Item value="fit">
            <Accordion.Control>{t('form.fitCheck')}</Accordion.Control>
            <Accordion.Panel>
                <Stack gap="sm">
                    {form.values.matchScore > 0 ? (
                        <Alert
                            variant="light"
                            color={scoreColor(form.values.matchScore)}
                            icon={<IconTargetArrow size={16} />}
                            title={t('form.fitCheckTitle', {
                                score: form.values.matchScore,
                            })}
                        >
                            {form.values.matchReason || t('form.fitCheckNoReason')}
                        </Alert>
                    ) : (
                        <Text size="sm" c="dimmed">
                            {t('form.fitCheckPending')}
                        </Text>
                    )}
                    <Button
                        variant="light"
                        onClick={doAssessFit}
                        loading={assessing}
                        leftSection={<IconTargetArrow size={16} />}
                        disabled={!form.values.companyName && !form.values.jobTitle}
                    >
                        {t('form.runFitCheck')}
                    </Button>
                </Stack>
            </Accordion.Panel>
        </Accordion.Item>
    );
}
