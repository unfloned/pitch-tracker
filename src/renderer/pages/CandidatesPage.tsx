import { Center, Loader, Stack, Text } from '@mantine/core';
import { modals } from '@mantine/modals';
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

export function CandidatesPage({ onCandidateImported, onGoToAgents }: Props) {
    const { t } = useTranslation();
    const ctrl = useCandidates();
    const [drawerCandidate, setDrawerCandidate] = useState<SerializedJobCandidate | null>(null);

    const handleCleanupLowScore = () => {
        modals.openConfirmModal({
            title: t('candidates.confirmCleanupLowScoreTitle', {
                count: ctrl.counts.lowScore,
            }),
            children: (
                <Text size="sm" c="dimmed">
                    {t('candidates.confirmDeleteBody')}
                </Text>
            ),
            labels: {
                confirm: t('candidates.confirmDeleteAction'),
                cancel: t('common.cancel'),
            },
            confirmProps: { color: 'red' },
            onConfirm: () => {
                ctrl.deleteBelowScore(50);
            },
        });
    };

    if (ctrl.loading && ctrl.candidates.length === 0 && ctrl.counts.total === 0) {
        return (
            <Center mih={400}>
                <Loader />
            </Center>
        );
    }

    if (ctrl.counts.total === 0) {
        return <InitialEmpty onGoToAgents={onGoToAgents} />;
    }

    return (
        <Stack gap="md">
            <PageHeader
                bucket={ctrl.bucket}
                onBucketChange={ctrl.setBucket}
                filteredCount={ctrl.filtered.length}
                counts={ctrl.counts}
                onGoToAgents={onGoToAgents}
                onCleanupLowScore={handleCleanupLowScore}
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
                bucket={ctrl.bucket}
                onFavorite={ctrl.bulkFavorite}
                onIgnore={ctrl.bulkIgnore}
                onRestore={ctrl.bulkRestore}
                onDelete={ctrl.bulkDelete}
                onRescore={ctrl.bulkRescore}
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
                onRescore={async (cand) => {
                    await ctrl.rescoreSingle(cand.id);
                    await ctrl.refresh();
                }}
            />
        </Stack>
    );
}
