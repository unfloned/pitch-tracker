/**
 * Outgoing mail domain - SMTP send + LLM-drafted cover letter.
 */

export {
    sendEmail,
    verifySmtp,
    type EmailSendRequest,
    type EmailSendResult,
} from './services/smtp.service';

export { draftEmail, type EmailDraft } from './services/draft.service';
