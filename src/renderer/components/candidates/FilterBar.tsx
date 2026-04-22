import { MultiSelect, NumberInput, Select, TextInput } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { ALL_JOB_SOURCES } from '@shared/job-search';
import type { SortBy, StatusFilter } from './types';

interface Props {
    searchText: string;
    onSearch: (v: string) => void;
    sourceFilter: string[];
    onSourceFilter: (v: string[]) => void;
    statusFilter: StatusFilter;
    onStatusFilter: (v: StatusFilter) => void;
    sortBy: SortBy;
    onSortBy: (v: SortBy) => void;
    minScore: number;
    onMinScore: (v: number) => void;
}

export function FilterBar({
    searchText,
    onSearch,
    sourceFilter,
    onSourceFilter,
    statusFilter,
    onStatusFilter,
    sortBy,
    onSortBy,
    minScore,
    onMinScore,
}: Props) {
    const { t } = useTranslation();
    return (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextInput
                leftSection={<IconSearch size={14} />}
                placeholder={t('candidates.filterSearchPlaceholder')}
                value={searchText}
                onChange={(e) => onSearch(e.currentTarget.value)}
                style={{ flex: 1, minWidth: 200 }}
                size="sm"
            />
            <MultiSelect
                placeholder={t('candidates.filterSource')}
                data={ALL_JOB_SOURCES.map((s) => ({ value: s, label: t(`source.${s}`) }))}
                value={sourceFilter}
                onChange={onSourceFilter}
                clearable
                size="sm"
                w={220}
                hidePickedOptions
            />
            <Select
                data={[
                    { value: 'all', label: t('candidates.filterStatusAll') },
                    { value: 'new', label: t('candidates.filterStatusNew') },
                    { value: 'favorite', label: t('candidates.filterStatusFavorite') },
                    { value: 'imported', label: t('candidates.filterStatusImported') },
                ]}
                value={statusFilter}
                onChange={(v) => v && onStatusFilter(v as StatusFilter)}
                size="sm"
                w={150}
                allowDeselect={false}
            />
            <Select
                data={[
                    { value: 'score_desc', label: t('candidates.sortByScore') },
                    { value: 'score_asc', label: t('candidates.sortByScoreAsc') },
                    { value: 'date_desc', label: t('candidates.sortByDate') },
                    { value: 'company_asc', label: t('candidates.sortByCompany') },
                ]}
                value={sortBy}
                onChange={(v) => v && onSortBy(v as SortBy)}
                size="sm"
                w={200}
                allowDeselect={false}
            />
            <NumberInput
                value={minScore}
                onChange={(v) => onMinScore(Number(v) || 0)}
                min={0}
                max={100}
                size="sm"
                w={100}
                placeholder={t('candidates.minScore')}
            />
        </div>
    );
}
