/**
 * Inbox domain - public API.
 *
 * Responsibilities split across modules:
 * - imap-client / imap-idle: low-level IMAP (connect, list, fetch, IDLE)
 * - classifier-prompt / classifier: LLM classification + prompt builder
 * - thread-match: pre-LLM matching via RFC822 headers + sender domain
 * - context: pull conversation history for the LLM prompt
 * - sync: orchestrate fetch → match → classify → store
 * - suggestions: accept / dismiss / reassign / set review status
 * - watcher: persistent IDLE connections + serialized sync trigger
 */

export {
    listMailboxes,
    testImapConnection,
    type ImapTestResult,
    type ListMailboxesResult,
    type MailboxInfo,
    type RawInboundMessage,
} from './imap-client';

export {
    buildClassifierPrompt,
    type ClassifyContext,
    type ClassifyInput,
    type ContextInboundMessage,
    type ContextSentMessage,
} from './classifier-prompt';

export {
    classifyInboundEmail,
    parseClassifierResponse,
    type ClassifyOutput,
} from './classifier';

export { syncInbox, type SyncResult } from './sync';

export {
    applySuggestion,
    dismissSuggestion,
    reassignSuggestion,
    setReviewStatus,
    type ApplySuggestionResult,
} from './suggestions';

export { startInboxIdleWatcher, stopInboxIdleWatcher } from './watcher';
