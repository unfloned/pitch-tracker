import {
    findInboundByAnyMessageId,
    findSentEmailByMessageId,
} from '../db';
import type { ApplicationRow } from '../db/types';
import type { RawInboundMessage } from './imap-client';

export interface PreMatch {
    applicationId: string;
    source: 'thread' | 'domain';
}

/**
 * Try to pin an inbound mail to an application BEFORE asking the LLM.
 * Thread match (RFC822 In-Reply-To / References against our DB) is rock-solid
 * - same Message-ID can't appear twice. Domain match is softer: sender
 * domain unambiguously matches one application's contact or website.
 */
export function computePreMatch(
    msg: RawInboundMessage,
    apps: ApplicationRow[],
): PreMatch | null {
    const threadIds = collectThreadIds(msg);
    if (threadIds.length > 0) {
        const sent = threadIds
            .map((id) => findSentEmailByMessageId(id))
            .find((r) => r !== null);
        if (sent) {
            return { applicationId: sent.applicationId, source: 'thread' };
        }
        const prevInbound = findInboundByAnyMessageId(threadIds);
        if (prevInbound?.suggestedApplicationId) {
            return {
                applicationId: prevInbound.suggestedApplicationId,
                source: 'thread',
            };
        }
    }

    const senderDomain = extractDomain(msg.fromAddress);
    if (!senderDomain) return null;

    const candidates = apps.filter((a) => {
        const contactDomain = extractDomain(a.contactEmail);
        if (contactDomain && contactDomain === senderDomain) return true;
        const websiteDomain = extractDomain(a.companyWebsite);
        if (websiteDomain && websiteDomain === senderDomain) return true;
        return false;
    });

    if (candidates.length === 1) {
        return { applicationId: candidates[0].id, source: 'domain' };
    }
    return null;
}

function collectThreadIds(msg: RawInboundMessage): string[] {
    const ids = new Set<string>();
    if (msg.inReplyTo) ids.add(msg.inReplyTo);
    for (const ref of msg.referenceIds) {
        if (ref) ids.add(ref);
    }
    return Array.from(ids);
}

function extractDomain(addressOrUrl: string): string {
    if (!addressOrUrl) return '';
    const atIdx = addressOrUrl.lastIndexOf('@');
    if (atIdx >= 0) {
        return addressOrUrl.slice(atIdx + 1).toLowerCase().replace(/^www\./, '');
    }
    try {
        const url = new URL(addressOrUrl.startsWith('http') ? addressOrUrl : 'http://' + addressOrUrl);
        return url.hostname.toLowerCase().replace(/^www\./, '');
    } catch {
        return '';
    }
}
