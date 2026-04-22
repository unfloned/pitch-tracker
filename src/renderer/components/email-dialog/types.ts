export type Mode = 'edit' | 'preview';

/** HTML cover-mail template with {{placeholders}} filled from profile + app. */
export const DEFAULT_TEMPLATE = `<p>Guten Tag{{greeting}},</p>
<p>ich möchte mich auf die Position <b>{{jobTitle}}</b> bei <b>{{company}}</b> bewerben.</p>
<p>Im Anhang finden Sie meinen Lebenslauf. Ich freue mich auf Ihre Rückmeldung.</p>
<p>Mit freundlichen Grüßen<br/>{{name}}</p>
{{signature}}`;

export function renderTemplate(raw: string, vars: Record<string, string>): string {
    return raw.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => vars[key] ?? '');
}
