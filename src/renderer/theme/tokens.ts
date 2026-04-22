/**
 * Pitch Tracker — Paper & Ink design tokens.
 * Shipped from Claude Design handoff 2026-04-22.
 *
 * Philosophy: warm paper neutrals, deep warm ink, single signal accent.
 * No gradients, no neon. Corners 0-5px. Hairlines never shadows.
 */

export const paper = {
    paper:      '#f4efe6',
    paper2:     '#ebe5d9',
    paper3:     '#e0d9c9',
    card:       '#fbf8f1',
    ink:        '#1c1a16',
    ink2:       '#37332c',
    ink3:       '#6c665b',
    ink4:       '#9a9387',
    rule:       '#d7cfbe',
    ruleStrong: '#b9b0a0',
    windowBg:   '#2a2723',
} as const;

export const signal = {
    marigold:  'oklch(0.74 0.15 70)',
    accentInk: 'oklch(0.38 0.10 60)',
    rust:      'oklch(0.52 0.13 35)',
    moss:      'oklch(0.55 0.08 145)',
    sky:       'oklch(0.60 0.08 230)',
} as const;

export const fonts = {
    display: '"Fraunces", Georgia, serif',
    ui:      '"Space Grotesk", -apple-system, BlinkMacSystemFont, sans-serif',
    mono:    '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
} as const;

/** CSS-var names. Use these in inline styles to ensure live-token updates. */
export const vars = {
    paper:      'var(--paper)',
    paper2:     'var(--paper-2)',
    paper3:     'var(--paper-3)',
    card:       'var(--card)',
    ink:        'var(--ink)',
    ink2:       'var(--ink-2)',
    ink3:       'var(--ink-3)',
    ink4:       'var(--ink-4)',
    rule:       'var(--rule)',
    ruleStrong: 'var(--rule-strong)',
    accent:     'var(--accent)',
    accentInk:  'var(--accent-ink)',
    rust:       'var(--rust)',
    moss:       'var(--moss)',
    sky:        'var(--sky)',
    fDisplay:   'var(--f-display)',
    fUi:        'var(--f-ui)',
    fMono:      'var(--f-mono)',
} as const;
