import { Center, Loader, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ApplicationRecord } from '../../preload/index';
import type { SerializedJobCandidate } from '@shared/job-search';
import { CandidateDrawer } from '../components/CandidateDrawer';
import { BulkActions } from '../components/candidates/BulkActions';
import { CandidateList } from '../components/candidates/CandidateList';
import { FilterBar } from '../components/candidates/FilterBar';
import { InitialEmpty, NoMatchBanner } from '../components/candidates/EmptyStates';
import { PageHeader } from '../components/candidates/PageHeader';
import { useCandidates } from '../components/candidates/useCandidates';

interface Props {
    onCandidateImported: (app: ApplicationRecord) => void;
    onGoToAgents: () => void;
}

/**
 * Agent-sourced job leads. Top: filters + bulk actions, body: list of rows,
 * detail on row click opens the CandidateDrawer. State in useCandidates hook.
 */
export function CandidatesPage({ onCandidateImported, onGoToAgents }: Props) {
    const { t } = useTranslation();
    const ctrl = useCandidates();
    const [drawerCandidate, setDrawerCandidate] = useState<SerializedJobCandidate | null>(null);

    if (ctrl.loading) {
        return (
            <Center mih={400}>
                <Loader />
            </Center>
        );
    }

    if (ctrl.candidates.length === 0) {
        return <InitialEmpty onGoToAgents={onGoToAgents} />;
    }

    return (
        <Stack gap="md">
            <PageHeader
                filteredCount={ctrl.filtered.length}
                totalCount={
                    ctrl.candidates.filter((c) => c.status !== 'ignored').length
                }
                onGoToAgents={onGoToAgents}
            />

            <FilterBar
                searchText={ctrl.searchText}
                onSearch={ctrl.setSearchText}
                sourceFilter={ctrl.sourceFilter}
                onSourceFilter={ctrl.setSourceFilter}
                statusFilter={ctrl.statusFilter}
                onStatusFilter={ctrl.setStatusFilter}
                sortBy={ctrl.sortBy}
                onSortBy={ctrl.setSortBy}
                minScore={ctrl.minScore}
                onMinScore={ctrl.setMinScore}
            />

            <BulkActions
                count={ctrl.selectedIds.size}
                onFavorite={ctrl.bulkFavorite}
                onIgnore={ctrl.bulkIgnore}
            />

            {ctrl.filtered.length === 0 ? (
                <NoMatchBanner />
            ) : (
                <CandidateList
                    candidates={ctrl.filtered}
                    selectedIds={ctrl.selectedIds}
                    allSelected={ctrl.allSelected}
                    onToggleSelectAll={ctrl.toggleSelectAll}
                    onToggleSelect={ctrl.toggleSelect}
                    onOpen={setDrawerCandidate}
                    onCandidateImported={onCandidateImported}
                    onRefresh={ctrl.refresh}
                />
            )}

            <CandidateDrawer
                candidate={
                    drawerCandidate
                        ? ctrl.candidates.find((c) => c.id === drawerCandidate.id) ??
                          drawerCandidate
                        : null
                }
                opened={!!drawerCandidate}
                onClose={() => setDrawerCandidate(null)}
                onImport={async (cand) => {
                    const app = await window.api.agents.importCandidate(cand.id);
                    onCandidateImported(app);
                    notifications.show({
                        color: 'green',
                        message: t('candidates.candidateAdded', {
                            name: cand.company || cand.title,
                        }),
                    });
                    setDrawerCandidate(null);
                    await ctrl.refresh();
                }}
                onDismiss={async (cand) => {
                    await window.api.agents.updateCandidate(cand.id, { status: 'ignored' });
                    setDrawerCandidate(null);
                    await ctrl.refresh();
                }}
                onToggleFavorite={async (cand) => {
                    await window.api.agents.updateCandidate(cand.id, {
                        favorite: !cand.favorite,
                    });
                    await ctrl.refresh();
                }}
            />
        </Stack>
    );
}
