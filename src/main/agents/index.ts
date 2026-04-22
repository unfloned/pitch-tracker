/**
 * Agents domain — public API. Everything the renderer (via IPC) and the main
 * process scheduler need lives here as a re-export. Implementation is split
 * into focused files: db init, searches, candidates, runs, scheduler, etc.
 */

export { initAgentsDatabase } from './db';
export { getAgentProfile, setAgentProfile } from './profile';
export {
    createSearch,
    deleteSearch,
    getSearch,
    listSearches,
    updateSearch,
} from './searches';
export {
    bulkUpdateCandidates,
    listCandidates,
    updateCandidate,
} from './candidates';
export {
    cancelSearchRun,
    isSearchRunning,
    listAgentRuns,
    listRunningSearches,
    runSearchNow,
} from './runs';
export { startAgentScheduler } from './scheduler';
