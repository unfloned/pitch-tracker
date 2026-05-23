/**
 * Pitch Tracker - v2 design tokens.
 *
 * Linear/Cron-vibe: warm charcoal dark / warm off-white light,
 * depth through surface elevation (not borders), amber accent.
 * Fraunces only as a sparse display accent, Geist runs the UI.
 */

export const light = {
    bg:           '#FAFAFB',
    surface:      '#FFFFFF',
    surface2:     '#F3F3F5',
    surface3:     '#ECECF0',
    text:         '#131318',
    textMuted:    '#6B6B75',
    textFaint:    '#9B9BA3',
    hairline:     'rgba(0,0,0,0.06)',
    hairline2:    'rgba(0,0,0,0.10)',
    accent:       '#C26416',
    accentSoft:   'rgba(194,100,22,0.08)',
    success:      '#4A6B3A',
    warning:      '#B58A0B',
    danger:       '#B83D2A',
} as const;

export const dark = {
    bg:           '#0D0D11',
    surface:      '#16161B',
    surface2:     '#1D1D24',
    surface3:     '#25252D',
    text:         '#ECECF0',
    textMuted:    '#8A8A95',
    textFaint:    '#5A5A64',
    hairline:     'rgba(255,255,255,0.06)',
    hairline2:    'rgba(255,255,255,0.10)',
    accent:       '#FFB35C',
    accentSoft:   'rgba(255,179,92,0.12)',
    success:      '#8FB075',
    warning:      '#E8C84B',
    danger:       '#E07A6B',
} as const;

export const fonts = {
    display: '"Fraunces", "Geist", -apple-system, system-ui, serif',
    ui:      '"Geist", -apple-system, system-ui, sans-serif',
    mono:    '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
} as const;

/** CSS-var names. Use these in inline styles to ensure live-token updates. */
export const vars = {
    bg:           'var(--bg)',
    surface:      'var(--surface)',
    surface2:     'var(--surface-2)',
    surface3:     'var(--surface-3)',
    text:         'var(--text)',
    textMuted:    'var(--text-muted)',
    textFaint:    'var(--text-faint)',
    hairline:     'var(--hairline)',
    hairline2:    'var(--hairline-2)',
    accent:       'var(--accent)',
    accentSoft:   'var(--accent-soft)',
    accentLine:   'var(--accent-line)',
    success:      'var(--success)',
    successSoft:  'var(--success-soft)',
    warning:      'var(--warning)',
    warningSoft:  'var(--warning-soft)',
    danger:       'var(--danger)',
    dangerSoft:   'var(--danger-soft)',
    shadowSm:     'var(--shadow-sm)',
    shadowMd:     'var(--shadow-md)',
    shadowLg:     'var(--shadow-lg)',
    fDisplay:     'var(--f-display)',
    fUi:          'var(--f-ui)',
    fMono:        'var(--f-mono)',

    /* legacy aliases — kept for unmigrated pages */
    paper:        'var(--bg)',
    paper2:       'var(--surface)',
    paper3:       'var(--surface-2)',
    card:         'var(--surface)',
    ink:          'var(--text)',
    ink2:         'var(--text)',
    ink3:         'var(--text-muted)',
    ink4:         'var(--text-faint)',
    rule:         'var(--hairline)',
    ruleStrong:   'var(--hairline-2)',
    rowHover:     'var(--surface-2)',
    accentInk:    'var(--accent)',
    rust:         'var(--danger)',
    moss:         'var(--success)',
    sky:          '#3A6B9E',
} as const;

/* legacy named exports — kept for unmigrated pages that import them */
export const neutral = {
    paper:      light.bg,
    paper2:     light.surface,
    paper3:     light.surface2,
    card:       light.surface,
    ink:        light.text,
    ink2:       light.text,
    ink3:       light.textMuted,
    ink4:       light.textFaint,
    rule:       light.hairline,
    ruleStrong: light.hairline2,
    rowHover:   light.surface2,
    windowBg:   light.bg,
} as const;

export const signal = {
    marigold:  light.accent,
    accentInk: light.accent,
    rust:      light.danger,
    moss:      light.success,
    sky:       '#3A6B9E',
} as const;
