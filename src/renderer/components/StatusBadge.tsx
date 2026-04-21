import { Badge } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { ApplicationStatus } from '@shared/application';

const COLORS: Record<ApplicationStatus, string> = {
    draft: 'gray',
    applied: 'blue',
    in_review: 'cyan',
    interview_scheduled: 'grape',
    interviewed: 'violet',
    offer_received: 'teal',
    accepted: 'green',
    rejected: 'red',
    withdrawn: 'dark',
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
    const { t } = useTranslation();
    return (
        <Badge color={COLORS[status]} variant="light" radius="sm">
            {t(`status.${status}`)}
        </Badge>
    );
}
