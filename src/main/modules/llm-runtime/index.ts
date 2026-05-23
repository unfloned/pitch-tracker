/**
 * LLM runtime domain - public API for other modules.
 *
 * Owns the Ollama lifecycle (config, status, start, model pull). Higher-level
 * LLM features (extraction, fit assessment, drafting, chat) live in their
 * respective domain modules and import from here.
 */

export type { LlmConfig, LlmStatus } from './services/config.service';
export { checkLlmStatus, getLlmConfig, setLlmConfig } from './services/config.service';

export type { StartResult } from './services/lifecycle.service';
export { startOllama, unloadModel } from './services/lifecycle.service';

export type { PullProgress } from './services/pull.service';
export { cancelPull, pullModel } from './services/pull.service';
