/**
 * Outgoing mail domain - SMTP send + LLM-drafted cover letter.
 */

export {
    sendEmail,
    verifySmtp,
    type EmailSendRequest,
    type EmailSendResult,
} from './smtp';

export { draftEmail, type EmailDraft } from './draft';
