/**
 * LLM domain entry point. Re-exports the small focused modules that handle
 * each Ollama interaction so callers don't need to know the layout. Adding a
 * new prompt-driven feature: drop a new file in this directory and re-export
 * the public function here.
 */

export type { LlmConfig, LlmStatus } from './config';
export { checkLlmStatus, getLlmConfig, setLlmConfig } from './config';

export type { StartResult } from './lifecycle';
export { startOllama, unloadModel } from './lifecycle';

export type { PullProgress } from './pull';
export { cancelPull, pullModel } from './pull';

export { extractJobData } from './extraction';
export { assessFit } from './fit';

export type { EmailDraft } from './email-draft';
export { draftEmail } from './email-draft';
