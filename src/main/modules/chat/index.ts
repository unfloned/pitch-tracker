/**
 * Chat assistant domain - LLM with read-only tool calling against our DB.
 *
 * - prompt: system prompt builder (with prompt-injection notice)
 * - tools: function-calling schemas + read-only handlers
 * - run: orchestration (loop, tool-hops, error mapping)
 */

export {
    runChat,
    type ChatMessage,
    type ChatRequest,
    type ChatResponse,
} from './services/run.service';
