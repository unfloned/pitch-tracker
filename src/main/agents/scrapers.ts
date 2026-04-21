import type { JobSource } from '@shared/job-search';

export interface RawJobListing {
    sourceUrl: string;
    sourceKey: string;
    title: string;
    company: string;
    location: string;
    summary: string;
}

export interface ScrapeContext {
    keywords: string;
    locationFilter: string;
    remoteOnly: boolean;
}

const USER_AGENT =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';

async function fetchHtml(url: string): Promise<string> {
    const response = await fetch(url, {
        headers: {
            'User-Agent': USER_AGENT,
            'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
        },
        signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status} von ${url}`);
    return await response.text();
}

function decodeHtml(s: string): string {
    return s
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .trim();
}

function stripTags(s: string): string {
    return decodeHtml(s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')).trim();
}

async function scrapeGermanTechJobs(ctx: ScrapeContext): Promise<RawJobListing[]> {
    const keywords = encodeURIComponent(ctx.keywords || 'TypeScript');
    const url = `https://germantechjobs.de/en/search?q=${keywords}`;
    const html = await fetchHtml(url);
    const listings: RawJobListing[] = [];

    const cardRegex = /<a[^>]+href="([^"]*\/jobs\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
    let match: RegExpExecArray | null;
    const seen = new Set<string>();

    while ((match = cardRegex.exec(html)) !== null) {
        const href = match[1];
        const inner = match[2];
        const full = href.startsWith('http') ? href : `https://germantechjobs.de${href}`;
        if (seen.has(full)) continue;
        seen.add(full);

        const text = stripTags(inner);
        if (text.length < 10) continue;

        const parts = text.split(/\s{2,}|\s\|\s/).filter((p) => p.length > 0);
        const title = parts[0] ?? text.slice(0, 80);
        const company = parts[1] ?? '';
        const location = parts.find((p) => /remote|deutschland|berlin|hamburg|münchen|köln|frankfurt/i.test(p)) ?? '';

        listings.push({
            sourceUrl: full,
            sourceKey: `germantechjobs:${href.split('/').pop() ?? full}`,
            title,
            company,
            location,
            summary: text.slice(0, 300),
        });

        if (listings.length >= 20) break;
    }

    return listings;
}

async function scrapeJoin(ctx: ScrapeContext): Promise<RawJobListing[]> {
    const keywords = encodeURIComponent(ctx.keywords || 'TypeScript');
    const url = `https://join.com/jobs?query=${keywords}&country=de`;
    const html = await fetchHtml(url);
    const listings: RawJobListing[] = [];

    const cardRegex = /<a[^>]+href="(\/companies\/[^"]+\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
    let match: RegExpExecArray | null;
    const seen = new Set<string>();

    while ((match = cardRegex.exec(html)) !== null) {
        const href = match[1];
        const inner = match[2];
        const full = `https://join.com${href}`;
        if (seen.has(full)) continue;
        seen.add(full);

        const text = stripTags(inner);
        if (text.length < 10) continue;

        const parts = text.split(/\s{2,}|\s\|\s/).filter((p) => p.length > 0);
        const title = parts[0] ?? text.slice(0, 80);
        const company = parts[1] ?? '';
        const location = parts.find((p) => /remote|hybrid|berlin|hamburg|münchen/i.test(p)) ?? '';

        listings.push({
            sourceUrl: full,
            sourceKey: `join:${href.split('/').pop() ?? full}`,
            title,
            company,
            location,
            summary: text.slice(0, 300),
        });

        if (listings.length >= 20) break;
    }

    return listings;
}

async function scrapeUrl(url: string): Promise<RawJobListing[]> {
    const html = await fetchHtml(url);
    const text = stripTags(html).slice(0, 1000);
    return [
        {
            sourceUrl: url,
            sourceKey: `url:${url}`,
            title: text.slice(0, 80),
            company: '',
            location: '',
            summary: text,
        },
    ];
}

export async function runScraper(source: JobSource, ctx: ScrapeContext): Promise<RawJobListing[]> {
    if (source === 'germantechjobs') return scrapeGermanTechJobs(ctx);
    if (source === 'join') return scrapeJoin(ctx);
    if (source === 'url') {
        if (!ctx.keywords.startsWith('http')) return [];
        return scrapeUrl(ctx.keywords);
    }
    return [];
}
