/**
 * Agents domain - public API. Everything the renderer (via IPC) and the main
 * process scheduler need lives here as a re-export. Implementation is split
 * into focused files: db init, searches, candidates, runs, scheduler, etc.
 */

export { initAgentsDatabase } from './services/db.service';
export { getAgentProfile, setAgentProfile } from './services/profile.service';
export {
    createSearch,
    deleteSearch,
    getSearch,
    listSearches,
    updateSearch,
} from './services/searches.service';
export {
    bulkUpdateCandidates,
    countCandidates,
    deleteCandidates,
    deleteCandidatesBelowScore,
    listCandidates,
    listIgnoredCandidates,
    rescoreCandidate,
    rescoreCandidates,
    updateCandidate,
} from './services/candidates.service';
export type { CandidateCounts, RescoreResult } from './services/candidates.service';
export {
    cancelSearchRun,
    isSearchRunning,
    listAgentRuns,
    listRunningSearches,
    runSearchNow,
} from './services/runs.service';
export { startAgentScheduler } from './services/scheduler.service';
