const KEY = 'pitchtracker.zoom.v1';

export interface ZoomPrefs {
    content: number;
    sidebar: number;
}

const DEFAULTS: ZoomPrefs = { content: 1, sidebar: 1 };
export const ZOOM_MIN = 0.9;
export const ZOOM_MAX = 1.4;

function clamp(v: number): number {
    if (!Number.isFinite(v)) return 1;
    return Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, v));
}

export function loadZoom(): ZoomPrefs {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return DEFAULTS;
        const parsed = JSON.parse(raw) as Partial<ZoomPrefs>;
        return {
            content: clamp(Number(parsed.content ?? 1)),
            sidebar: clamp(Number(parsed.sidebar ?? 1)),
        };
    } catch {
        return DEFAULTS;
    }
}

export function saveZoom(prefs: ZoomPrefs): void {
    try {
        localStorage.setItem(KEY, JSON.stringify(prefs));
    } catch {
        // ignore
    }
}

export function applyZoom(prefs: ZoomPrefs): void {
    const root = document.documentElement;
    // Both scales are independent: content-zoom only affects the main content
    // area, sidebar-zoom only affects the sidebar font-size. No ratio math.
    root.style.setProperty('--zoom-content', String(clamp(prefs.content)));
    root.style.setProperty('--zoom-sidebar-rel', String(clamp(prefs.sidebar)));
}
