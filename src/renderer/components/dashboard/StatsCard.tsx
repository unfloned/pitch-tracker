import { SimpleGrid } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { SectionHeader } from './SectionHeader';
import { StatTile } from './StatTile';
import type { PageKey } from './types';

interface Props {
    total: number;
    applied: number;
    interviewing: number;
    accepted: number;
    avgMatch: number;
    onNavigate: (page: PageKey) => void;
}

export function StatsCard({
    total,
    applied,
    interviewing,
    accepted,
    avgMatch,
    onNavigate,
}: Props) {
    const { t } = useTranslation();
    return (
        <div>
            <SectionHeader title={t('dashboard.sectionStats')} />
            <SimpleGrid cols={{ base: 2, sm: 3, md: 5 }} spacing="sm">
                <StatTile
                    label={t('dashboard.total')}
                    value={total}
                    onClick={() => onNavigate('applications')}
                />
                <StatTile label={t('dashboard.applied')} value={applied} />
                <StatTile label={t('dashboard.interviewing')} value={interviewing} />
                <StatTile label={t('dashboard.accepted')} value={accepted} />
                <StatTile
                    label={t('dashboard.avgMatch')}
                    value={avgMatch > 0 ? avgMatch : t('dashboard.emptyStat')}
                    sub={avgMatch > 0 ? '/ 100' : undefined}
                />
            </SimpleGrid>
        </div>
    );
}
