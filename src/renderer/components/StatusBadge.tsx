import { Badge } from '@mantine/core';
import { ApplicationStatus, STATUS_LABEL } from '@shared/application';

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
    return (
        <Badge color={COLORS[status]} variant="light" radius="sm">
            {STATUS_LABEL[status]}
        </Badge>
    );
}
