import { useCallback, useEffect, useMemo, useState } from 'react';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import type { CandidateCountsDto } from '../../../preload/index';
import type { SerializedJobCandidate } from '@shared/job-search';
import { loadCandidatesPrefs, saveCandidatesPrefs } from './prefs';
import type { SortBy, StatusFilter } from './types';

export type CandidateBucket = 'active' | 'ignored';

const EMPTY_COUNTS: CandidateCountsDto = {
    active: 0,
    ignored: 0,
    imported: 0,
    lowScore: 0,
    total: 0,
};

export function useCandidates() {
    const { t } = useTranslation();
    const prefs = loadCandidatesPrefs();

    const [bucket, setBucketState] = useState<CandidateBucket>(prefs.bucket);
    const [candidates, setCandidates] = useState<SerializedJobCandidate[]>([]);
    const [counts, setCounts] = useState<CandidateCountsDto>(EMPTY_COUNTS);
    const [loading, setLoading] = useState(true);
    const [minScore, setMinScoreState] = useState(prefs.minScore);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [sourceFilter, setSourceFilterState] = useState<string[]>(prefs.sourceFilter);
    const [statusFilter, setStatusFilterState] = useState<StatusFilter>(prefs.statusFilter);
    const [sortBy, setSortByState] = useState<SortBy>(prefs.sortBy);
    const [searchText, setSearchText] = useState('');

    const setMinScore = (v: number) => {
        setMinScoreState(v);
        saveCandidatesPrefs({ minScore: v });
    };
    const setSourceFilter = (v: string[]) => {
        setSourceFilterState(v);
        saveCandidatesPrefs({ sourceFilter: v });
    };
    const setStatusFilter = (v: StatusFilter) => {
        setStatusFilterState(v);
        saveCandidatesPrefs({ statusFilter: v });
    };
    const setSortBy = (v: SortBy) => {
        setSortByState(v);
        saveCandidatesPrefs({ sortBy: v });
    };
    const setBucket = (v: CandidateBucket) => {
        setBucketState(v);
        setSelectedIds(new Set());
        saveCandidatesPrefs({ bucket: v });
    };

    const refreshCounts = useCallback(async () => {
        try {
            const c = await window.api.agents.countCandidates();
            setCounts(c);
        } catch {
            // non-fatal
        }
    }, []);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const [list] = await Promise.all([
                bucket === 'ignored'
                    ? window.api.agents.listIgnoredCandidates()
                    : window.api.agents.listCandidates(0),
                refreshCounts(),
            ]);
            setCandidates(list);
        } catch (err) {
            notifications.show({
                color: 'red',
                title: t('notifications.loadFailed'),
                message: (err as Error).message,
            });
        } finally {
            setLoading(false);
        }
    }, [t, bucket, refreshCounts]);

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
            if (bucket === 'active') {
                if (c.score < minScore) return false;
                if (statusFilter === 'new' && c.status !== 'new') return false;
                if (statusFilter === 'favorite' && !c.favorite) return false;
                if (statusFilter === 'imported' && c.status !== 'imported') return false;
                if (statusFilter === 'all' && c.status === 'ignored') return false;
            }
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
    }, [candidates, minScore, statusFilter, sourceFilter, sortBy, searchText, bucket]);

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

    const bulkRestore = async () => {
        await window.api.agents.bulkUpdateCandidates([...selectedIds], { status: 'new' });
        setSelectedIds(new Set());
        await refresh();
    };

    const bulkDelete = async () => {
        const selected = [...selectedIds];
        const idSet = new Set(selected);
        const importedIds = candidates
            .filter((c) => idSet.has(c.id) && c.status === 'imported')
            .map((c) => c.id);
        const deletableIds = selected.filter((id) => !importedIds.includes(id));

        if (deletableIds.length === 0) {
            notifications.show({
                color: 'yellow',
                message: `Alle ${importedIds.length} ausgewählten sind bereits als Bewerbung importiert und werden nicht gelöscht.`,
            });
            return;
        }

        const deleted = await window.api.agents.deleteCandidates(deletableIds);
        setSelectedIds(new Set());
        await refresh();

        const skippedMsg =
            importedIds.length > 0
                ? ` · ${importedIds.length} übersprungen (als Bewerbung importiert)`
                : '';
        notifications.show({
            color: 'green',
            message: `${deleted} gelöscht${skippedMsg}`,
        });
    };

    const deleteBelowScore = async (threshold: number) => {
        const n = await window.api.agents.deleteCandidatesBelowScore(threshold);
        await refresh();
        notifications.show({
            color: 'green',
            message: `${n} Vorschläge mit Score < ${threshold} gelöscht.`,
        });
        return n;
    };

    const bulkRescore = async () => {
        const ids = [...selectedIds];
        if (ids.length === 0) return;
        const notifId = 'bulk-rescore';
        notifications.show({
            id: notifId,
            loading: true,
            title: `Neu bewerte ${ids.length} Einträge`,
            message: 'Das kann einen Moment dauern.',
            autoClose: false,
            withCloseButton: false,
        });
        try {
            const result = await window.api.agents.rescoreCandidates(ids);
            notifications.update({
                id: notifId,
                loading: false,
                color: result.errors > 0 ? 'yellow' : 'green',
                title: 'Neu bewertet',
                message:
                    result.errors > 0
                        ? `${result.scored} neu bewertet, ${result.errors} Fehler (LLM offline?)`
                        : `${result.scored} neu bewertet`,
                autoClose: 4000,
                withCloseButton: true,
            });
            setSelectedIds(new Set());
            await refresh();
        } catch (err) {
            notifications.update({
                id: notifId,
                loading: false,
                color: 'red',
                title: 'Fehler',
                message: (err as Error).message,
                autoClose: 6000,
                withCloseButton: true,
            });
        }
    };

    const rescoreSingle = async (id: string) => {
        return window.api.agents.rescoreCandidate(id);
    };

    return {
        bucket,
        setBucket,
        candidates,
        counts,
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
        bulkRestore,
        bulkDelete,
        bulkRescore,
        rescoreSingle,
        deleteBelowScore,
    };
}
