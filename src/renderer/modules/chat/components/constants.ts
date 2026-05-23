export const TOOLS = [
    { id: 'list_applications', name: 'List applications', desc: 'Filter by status' },
    { id: 'count_by_status',   name: 'Count by status',   desc: 'Tally per stage' },
    { id: 'stats',             name: 'Stats',             desc: 'Match avg, top companies' },
    { id: 'list_candidates',   name: 'List candidates',   desc: 'Agent leads, min score' },
    { id: 'search_applications', name: 'Search',          desc: 'Company/title/notes/tags' },
] as const;

export const SUGGESTIONS_KEYS = [
    'chat.suggestion1',
    'chat.suggestion2',
    'chat.suggestion3',
    'chat.suggestion4',
];
