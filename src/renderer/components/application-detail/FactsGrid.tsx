import { useTranslation } from 'react-i18next';
import type { ApplicationRecord } from '../../../preload/index';
import { formatDateShort, formatSalary, splitStack } from '../../lib/format';
import { Label } from '../primitives/Label';
import { priorityLabel } from './utils';

interface Props {
    app: ApplicationRecord;
}

interface Fact {
    label: string;
    value: string;
    mono: boolean;
}

/** 2x3 card with the key facts of the application (salary, match, etc.). */
export function FactsGrid({ app }: Props) {
    const { t } = useTranslation();
    const stackItems = splitStack(app.stack).slice(0, 3);
    const hasMatch = app.matchScore > 0;

    const facts: Fact[] = [
        {
            label: t('detail.facts.salary', 'Salary'),
            value: formatSalary(app.salaryMin, app.salaryMax, app.salaryCurrency),
            mono: true,
        },
        {
            label: t('detail.facts.match', 'Match'),
            value: hasMatch ? `${app.matchScore} / 100` : '—',
            mono: true,
        },
        {
            label: t('detail.facts.applied', 'Applied'),
            value: formatDateShort(app.appliedAt),
            mono: true,
        },
        {
            label: t('detail.facts.stack', 'Stack'),
            value: stackItems.length > 0 ? stackItems.join(' · ') : '—',
            mono: false,
        },
        {
            label: t('detail.facts.contact', 'Contact'),
            value: app.contactName || '—',
            mono: false,
        },
        {
            label: t('detail.facts.priority', 'Priority'),
            value: priorityLabel(app.priority, t),
            mono: false,
        },
    ];

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 0,
                background: 'var(--card)',
                border: '1px solid var(--rule)',
            }}
        >
            {facts.map((f, i) => (
                <div
                    key={f.label}
                    style={{
                        padding: '10px 14px',
                        borderRight: i % 2 === 0 ? '1px solid var(--rule)' : 'none',
                        borderBottom: i < 4 ? '1px solid var(--rule)' : 'none',
                    }}
                >
                    <Label>{f.label}</Label>
                    <div
                        className={f.mono ? 'mono tnum' : ''}
                        style={{
                            fontSize: 13,
                            color: 'var(--ink)',
                            fontWeight: 500,
                            marginTop: 3,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {f.value}
                    </div>
                </div>
            ))}
        </div>
    );
}
