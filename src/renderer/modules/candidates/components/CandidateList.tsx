import { Checkbox } from '@mantine/core';
import type { ApplicationRecord } from '../../../../preload/index';
import type { SerializedJobCandidate } from '@shared/job-search';
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

/** v2 list: soft surface, no border, sticky select-all header. */
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
        <div
            style={{
                background: 'var(--surface)',
                borderRadius: 10,
                boxShadow: 'var(--shadow-sm)',
                overflow: 'hidden',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '10px 18px',
                    borderBottom: '1px solid var(--hairline)',
                    background: 'var(--surface)',
                }}
            >
                <Checkbox
                    size="xs"
                    checked={allSelected}
                    indeterminate={!allSelected && selectedIds.size > 0}
                    onChange={onToggleSelectAll}
                />
                <span
                    style={{
                        fontSize: 11.5,
                        fontWeight: 500,
                        color: 'var(--text-muted)',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                    }}
                >
                    {candidates.length} {candidates.length === 1 ? 'match' : 'matches'}
                </span>
            </div>

            <div style={{ padding: 6 }}>
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
        </div>
    );
}
