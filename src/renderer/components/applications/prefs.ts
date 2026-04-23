export type AppBucket = 'active' | 'pipeline' | 'archive' | 'all';
export type AppView = 'list' | 'board';

export type AppColumnId =
    | 'id'
    | 'salary'
    | 'location'
    | 'match'
    | 'source'
    | 'updated';

export interface AppColumnDef {
    id: AppColumnId;
    label: string;
    width: string;
}

export const APP_COLUMN_DEFS: AppColumnDef[] = [
    { id: 'id', label: 'ID', width: '72px' },
    { id: 'salary', label: 'SALARY', width: '96px' },
    { id: 'location', label: 'LOCATION', width: '120px' },
    { id: 'match', label: 'MATCH', width: '96px' },
    { id: 'source', label: 'SRC', width: '78px' },
    { id: 'updated', label: 'UPDATED', width: '72px' },
];

const DEFAULT_VISIBLE: AppColumnId[] = ['id', 'salary', 'location', 'match', 'source', 'updated'];

export interface AppPrefs {
    bucket: AppBucket;
    statusFilter: string | null;
    view: AppView;
    visibleColumns: AppColumnId[];
}

const DEFAULTS: AppPrefs = {
    bucket: 'active',
    statusFilter: null,
    view: 'list',
    visibleColumns: DEFAULT_VISIBLE,
};

const KEY = 'pitchtracker.applications.prefs.v1';

export function loadAppPrefs(): AppPrefs {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return DEFAULTS;
        const parsed = JSON.parse(raw) as Partial<AppPrefs>;
        const visible = Array.isArray(parsed.visibleColumns)
            ? (parsed.visibleColumns.filter((v): v is AppColumnId =>
                  APP_COLUMN_DEFS.some((def) => def.id === v),
              ) as AppColumnId[])
            : DEFAULTS.visibleColumns;
        return {
            bucket: (parsed.bucket as AppBucket) ?? DEFAULTS.bucket,
            statusFilter:
                typeof parsed.statusFilter === 'string' || parsed.statusFilter === null
                    ? parsed.statusFilter
                    : DEFAULTS.statusFilter,
            view: (parsed.view as AppView) ?? DEFAULTS.view,
            visibleColumns: visible.length > 0 ? visible : DEFAULTS.visibleColumns,
        };
    } catch {
        return DEFAULTS;
    }
}

export function saveAppPrefs(patch: Partial<AppPrefs>): void {
    try {
        const current = loadAppPrefs();
        const next = { ...current, ...patch };
        localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
        // ignore
    }
}

/**
 * Build the grid-template-columns string used by both the table header and
 * ApplicationRow. Layout: priority-strip + optional columns + role (flex) +
 * actions (sticky). `role` stays fixed between the configurable columns and
 * the always-on actions cell so the layout stays stable.
 */
export function buildAppRowGrid(visible: AppColumnId[]): string {
    const parts: string[] = ['4px']; // priority strip
    // stage (always on) comes before role in the original layout
    parts.push('140px'); // stage
    // id is configurable but originally sat between stage... actually in the
    // original template: priority, id, stage, role, salary, location, match,
    // source, updated, actions. We keep that order here, skipping hidden ones.
    // Since priority+stage are first and role+actions last, we preserve that
    // while allowing the middle ones to drop out.
    // Re-layout with user-configurable middle section:
    parts.length = 0;
    parts.push('4px'); // priority
    if (visible.includes('id')) parts.push('72px');
    parts.push('140px'); // stage (always)
    parts.push('minmax(240px, 1fr)'); // role (always)
    if (visible.includes('salary')) parts.push('96px');
    if (visible.includes('location')) parts.push('120px');
    if (visible.includes('match')) parts.push('96px');
    if (visible.includes('source')) parts.push('78px');
    if (visible.includes('updated')) parts.push('72px');
    parts.push('60px'); // actions
    return parts.join(' ');
}
