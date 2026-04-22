import { useCallback, useEffect, useMemo, useState } from 'react';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import type { SerializedJobCandidate } from '@shared/job-search';
import type { SortBy, StatusFilter } from './types';

/**
 * Loads candidates, listens to agent-run events to refresh, and exposes the
 * filtered/sorted list plus selection helpers. Keeps CandidatesPage lean.
 */
export function useCandidates() {
    const { t } = useTranslation();
    const [candidates, setCandidates] = useState<SerializedJobCandidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [minScore, setMinScore] = useState(50);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [sourceFilter, setSourceFilter] = useState<string[]>([]);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [sortBy, setSortBy] = useState<SortBy>('score_desc');
    const [searchText, setSearchText] = useState('');

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const c = await window.api.agents.listCandidates(0);
            setCandidates(c);
        } catch (err) {
            notifications.show({
                color: 'red',
                title: t('notifications.loadFailed'),
                message: (err as Error).message,
            });
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        refresh();
        const offCandidateAdded = window.api.on('agents:candidateAdded', () => refresh());
        const offFinished = window.api.on('agents:runFinished', () => refresh());
        return () => {
            offCandidateAdded();
            offFinished();
        };
    }, [refresh]);

    const filtered = useMemo(() => {
        const q = searchText.toLowerCase().trim();
        let list = candidates.filter((c) => {
            if (c.score < minScore) return false;
            if (statusFilter === 'new' && c.status !== 'new') return false;
            if (statusFilter === 'favorite' && !c.favorite) return false;
            if (statusFilter === 'imported' && c.status !== 'imported') return false;
            if (statusFilter === 'all' && c.status === 'ignored') return false;
            if (sourceFilter.length > 0) {
                const matches = sourceFilter.some((src) => c.sourceKey.startsWith(src + ':'));
                if (!matches) return false;
            }
            if (q) {
                const blob = `${c.company} ${c.title} ${c.location}`.toLowerCase();
                if (!blob.includes(q)) return false;
            }
            return true;
        });
        list = [...list].sort((a, b) => {
            if (sortBy === 'score_desc') return b.score - a.score;
            if (sortBy === 'score_asc') return a.score - b.score;
            if (sortBy === 'date_desc')
                return new Date(b.discoveredAt).getTime() - new Date(a.discoveredAt).getTime();
            if (sortBy === 'company_asc') return (a.company || '').localeCompare(b.company || '');
            return 0;
        });
        return list;
    }, [candidates, minScore, statusFilter, sourceFilter, sortBy, searchText]);

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const allSelected = filtered.length > 0 && filtered.every((c) => selectedIds.has(c.id));

    const toggleSelectAll = () => {
        setSelectedIds(allSelected ? new Set() : new Set(filtered.map((c) => c.id)));
    };

    const bulkIgnore = async () => {
        await window.api.agents.bulkUpdateCandidates([...selectedIds], { status: 'ignored' });
        setSelectedIds(new Set());
        await refresh();
    };

    const bulkFavorite = async () => {
        await window.api.agents.bulkUpdateCandidates([...selectedIds], { favorite: true });
        setSelectedIds(new Set());
        await refresh();
    };

    return {
        candidates,
        loading,
        filtered,
        minScore,
        setMinScore,
        selectedIds,
        toggleSelect,
        allSelected,
        toggleSelectAll,
        sourceFilter,
        setSourceFilter,
        statusFilter,
        setStatusFilter,
        sortBy,
        setSortBy,
        searchText,
        setSearchText,
        refresh,
        bulkIgnore,
        bulkFavorite,
    };
}
