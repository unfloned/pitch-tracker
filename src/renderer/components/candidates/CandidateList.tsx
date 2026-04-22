import { Checkbox } from '@mantine/core';
import type { ApplicationRecord } from '../../../preload/index';
import type { SerializedJobCandidate } from '@shared/job-search';
import { Label } from '../primitives/Label';
import { CandidateRow } from './CandidateRow';

interface Props {
    candidates: SerializedJobCandidate[];
    selectedIds: Set<string>;
    allSelected: boolean;
    onToggleSelectAll: () => void;
    onToggleSelect: (id: string) => void;
    onOpen: (candidate: SerializedJobCandidate) => void;
    onCandidateImported: (app: ApplicationRecord) => void;
    onRefresh: () => Promise<void>;
}

/** Paper-bordered list with a select-all header and one row per candidate. */
export function CandidateList({
    candidates,
    selectedIds,
    allSelected,
    onToggleSelectAll,
    onToggleSelect,
    onOpen,
    onCandidateImported,
    onRefresh,
}: Props) {
    return (
        <div style={{ border: '1px solid var(--rule)', background: 'var(--card)' }}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '6px 12px',
                    borderBottom: '1px solid var(--rule-strong)',
                    background: 'var(--paper-2)',
                }}
            >
                <Checkbox
                    size="xs"
                    checked={allSelected}
                    indeterminate={!allSelected && selectedIds.size > 0}
                    onChange={onToggleSelectAll}
                />
                <Label>
                    {candidates.length} {candidates.length === 1 ? 'match' : 'matches'}
                </Label>
            </div>

            {candidates.map((c) => (
                <CandidateRow
                    key={c.id}
                    candidate={c}
                    selected={selectedIds.has(c.id)}
                    onOpen={onOpen}
                    onToggleSelect={onToggleSelect}
                    onCandidateImported={onCandidateImported}
                    onRefresh={onRefresh}
                />
            ))}
        </div>
    );
}
