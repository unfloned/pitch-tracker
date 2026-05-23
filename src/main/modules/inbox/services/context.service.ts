import {
    listEmailsForApplication,
    listInboundEmailsByApplication,
} from '../../../db';
import type { ApplicationRow } from '../../../db/types';
import type { ClassifyContext } from './classifier-prompt.service';

/**
 * Pull together the conversation history for one application: status,
 * notes, interviews + every previously stored inbound mail and our own
 * sent mails. This becomes the "# Verlauf" block in the classifier prompt
 * so the LLM doesn't judge each new mail in isolation.
 */
export function buildContextForApplication(
    applicationId: string | undefined,
    apps: ApplicationRow[],
): ClassifyContext | undefined {
    if (!applicationId) return undefined;
    const app = apps.find((a) => a.id === applicationId);
    if (!app) return undefined;

    const inbound = listInboundEmailsByApplication(applicationId);
    const sent = listEmailsForApplication(applicationId);

    return {
        likelyApplication: {
            id: app.id,
            companyName: app.companyName,
            jobTitle: app.jobTitle,
            status: app.status,
            notes: app.notes,
            interviews: app.interviews,
        },
        previousInbound: inbound.map((m) => ({
            receivedAt: m.receivedAt,
            fromAddress: m.fromAddress,
            subject: m.subject,
            bodyText: m.bodyText,
            matchedApplicationId: m.suggestedApplicationId,
            suggestedStatus: m.suggestedStatus,
        })),
        previousSent: sent.map((m) => ({
            sentAt: m.sentAt.toISOString(),
            toAddress: m.toAddress,
            subject: m.subject,
            body: m.body,
        })),
    };
}
