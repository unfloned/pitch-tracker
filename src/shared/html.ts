export function stripHtml(html: string): string {
    if (!html) return '';
    return html
        .replace(/<\s*br\s*\/?\s*>/gi, '\n')
        .replace(/<\/\s*(p|div|li|h[1-6])\s*>/gi, '\n')
        .replace(/<li[^>]*>/gi, '• ')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}
