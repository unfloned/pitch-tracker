/**
 * Pure formatting helpers used across row / detail / list views.
 * Everything here takes primitives and returns strings or colors, no React,
 * no i18n, no hooks — so the same helpers work in any component.
 */

/** "Acme Inc." → "AI". "Google" → "GO". Blank → "?". */
export function initialsFor(name: string): string {
    if (!name) return '?';
    const clean = name.replace(/\s+(GmbH|AG|SE|Ltd|LLC|Inc\.?)$/i, '').trim();
    const words = clean.split(/\s+/).filter(Boolean);
    if (words.length === 0) return '?';
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
}

/** "€82k" / "€82–96k" / "—" (for empty). */
export function formatSalary(min: number, max: number, currency: string): string {
    if (!min && !max) return '—';
    const c = currency || 'EUR';
    const sym = c === 'EUR' ? '€' : c + ' ';
    if (min && max) return `${sym}${(min / 1000).toFixed(0)}–${(max / 1000).toFixed(0)}k`;
    return `${sym}${((min || max) / 1000).toFixed(0)}k`;
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Apr 02", returns "—" for missing/invalid input. */
export function formatDateShort(iso: string | Date | null | undefined): string {
    if (!iso) return '—';
    const d = typeof iso === 'string' ? new Date(iso) : iso;
    if (Number.isNaN(d.getTime())) return '—';
    return `${MONTHS_SHORT[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}`;
}

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

/** "TUE · 14:00" — time-of-day with short weekday. */
export function formatEventTime(iso: string | Date): string {
    const d = typeof iso === 'string' ? new Date(iso) : iso;
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${WEEKDAYS[d.getDay()]} · ${hh}:${mm}`;
}

/** "2h ago" / "3d ago" / ISO date for older. "—" for missing. */
export function formatUpdated(date?: string | Date | null): string {
    if (!date) return '—';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (Number.isNaN(d.getTime())) return '—';
    const diff = Date.now() - d.getTime();
    const h = Math.floor(diff / 3_600_000);
    if (h < 1) return 'just now';
    if (h < 24) return `${h}h ago`;
    const days = Math.floor(h / 24);
    if (days < 30) return `${days}d ago`;
    return d.toISOString().slice(0, 10);
}

/** Strip tags + collapse whitespace, truncate with ellipsis when needed. */
export function stripHtmlSnippet(html: string, max = 140): string {
    const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return text.length > max ? text.slice(0, max).trim() + '…' : text;
}

/** CSS var for the priority-strip color. Unknown priorities fall back to rule. */
export function priorityColor(priority: string | undefined): string {
    if (priority === 'high') return 'var(--accent)';
    if (priority === 'medium') return 'var(--ink-3)';
    return 'var(--rule-strong)';
}

/** Comma/semicolon-separated stack string to trimmed list. */
export function splitStack(stack: string): string[] {
    if (!stack) return [];
    return stack
        .split(/[,;]/)
        .map((s) => s.trim())
        .filter(Boolean);
}

/** Trim URLs to host + path root for the SRC column. */
export function shortSource(src: string, max = 14): string {
    if (!src) return 'direct';
    return src.replace(/^https?:\/\//, '').replace(/\/$/, '').slice(0, max);
}

const CANDIDATE_SOURCE_SHORT: Record<string, string> = {
    germantechjobs: 'GermanTechJobs',
    remotive: 'Remotive',
    arbeitnow: 'Arbeitnow',
    remoteok: 'RemoteOK',
    wwr: 'WeWorkRemotely',
    weworkremotely: 'WeWorkRemotely',
    hackernews: 'HackerNews',
    indeed: 'Indeed',
    url: 'Direct URL',
};

/** Extract and label the origin source from a candidate sourceKey like "hackernews:123". */
export function candidateSourceLabel(sourceKey: string): string {
    if (!sourceKey) return 'unknown';
    const prefix = sourceKey.split(':')[0]?.toLowerCase() ?? '';
    return CANDIDATE_SOURCE_SHORT[prefix] ?? (prefix || 'unknown');
}
