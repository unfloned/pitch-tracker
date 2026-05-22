/**
 * HTML sanitizer for renderer-side `dangerouslySetInnerHTML` and main-side
 * pre-storage cleanup. Strips tags that can execute scripts, load remote
 * resources or break out of the document context, plus inline event handlers
 * and javascript: URLs.
 *
 * This is intentionally a regex-based stripper, not a full DOM parser. It's
 * defense-in-depth around a) Tiptap output we already trust and b) LLM
 * output we never trust. For untrusted input the server-side
 * `escapeHtml` (plain-text safe) is the primary defense; this is the
 * second line.
 */

const FORBIDDEN_TAGS = [
    'script',
    'style',
    'iframe',
    'object',
    'embed',
    'form',
    'input',
    'button',
    'link',
    'meta',
    'base',
    'svg',
    'math',
];

const FORBIDDEN_PAIRED = new RegExp(
    `<\\s*(${FORBIDDEN_TAGS.join('|')})\\b[^>]*>[\\s\\S]*?<\\s*/\\s*\\1\\s*>`,
    'gi',
);
const FORBIDDEN_SELF = new RegExp(
    `<\\s*(${FORBIDDEN_TAGS.join('|')})\\b[^>]*\\/?\\s*>`,
    'gi',
);
const ON_EVENT_ATTR = /\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const JS_URL = /\b(href|src|action|formaction|xlink:href|poster|background)\s*=\s*("\s*javascript:[^"]*"|'\s*javascript:[^']*')/gi;
const DATA_URL = /\b(href|src)\s*=\s*("data:text\/html[^"]*"|'data:text\/html[^']*')/gi;

/**
 * Strip dangerous HTML. Safe HTML (p, br, strong, em, ul/ol/li, a, h1-h6,
 * blockquote, code, etc.) passes through untouched. Run this on every
 * string that goes into dangerouslySetInnerHTML.
 */
export function sanitizeHtml(html: string | null | undefined): string {
    if (!html) return '';
    return html
        .replace(FORBIDDEN_PAIRED, '')
        .replace(FORBIDDEN_SELF, '')
        .replace(ON_EVENT_ATTR, '')
        .replace(JS_URL, '$1=""')
        .replace(DATA_URL, '$1=""');
}

/**
 * Escape every HTML-meaningful character for safe interpolation into HTML.
 * Use this when you have plain text (e.g. an LLM-generated note) that you
 * want to drop into an HTML field without ever creating a tag.
 */
export function escapeHtml(text: string | null | undefined): string {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
