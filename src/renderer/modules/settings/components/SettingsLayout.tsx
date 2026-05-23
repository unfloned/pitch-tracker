import { ReactNode, useEffect, useState } from 'react';

export interface SettingsTab {
    id: string;
    label: string;
    /** Optional short hint shown under the label in the nav. */
    hint?: string;
    render: () => ReactNode;
}

interface Props {
    tabs: SettingsTab[];
    /** Default tab id when no hash is present. */
    defaultTab: string;
    /** Header content (page title + version badge), rendered above the panel. */
    header: ReactNode;
}

/**
 * Two-column settings shell: nav on the left (sticky), content on the right.
 * The selected tab is reflected in `location.hash` so the user can deep-link
 * to a specific tab from the command palette or refreshes preserve state.
 */
export function SettingsLayout({ tabs, defaultTab, header }: Props) {
    const [activeId, setActiveId] = useState<string>(() => readHash() || defaultTab);

    useEffect(() => {
        const onHash = () => {
            const id = readHash();
            if (id && tabs.some((t) => t.id === id)) setActiveId(id);
        };
        window.addEventListener('hashchange', onHash);
        return () => window.removeEventListener('hashchange', onHash);
    }, [tabs]);

    const select = (id: string) => {
        setActiveId(id);
        // Replace the hash without adding a history entry so the back button
        // doesn't fill up with each tab click.
        const url = `${window.location.pathname}${window.location.search}#${id}`;
        window.history.replaceState(null, '', url);
    };

    const active = tabs.find((t) => t.id === activeId) ?? tabs[0];

    return (
        <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', maxWidth: 1280 }}>
            <nav
                style={{
                    flex: '0 0 200px',
                    position: 'sticky',
                    top: 'calc(var(--app-shell-header-height, 36px) + 12px)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    paddingRight: 12,
                }}
            >
                {tabs.map((tab) => {
                    const isActive = tab.id === active.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => select(tab.id)}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 2,
                                alignItems: 'flex-start',
                                padding: '8px 12px',
                                border: 'none',
                                borderRadius: 7,
                                background: isActive ? 'var(--surface)' : 'transparent',
                                color: isActive ? 'var(--text)' : 'var(--text-muted)',
                                fontFamily: 'var(--f-ui)',
                                fontSize: 13.5,
                                fontWeight: isActive ? 600 : 450,
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'background 100ms, color 100ms',
                            }}
                            onMouseEnter={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.background = 'var(--surface)';
                                    e.currentTarget.style.color = 'var(--text)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = 'var(--text-muted)';
                                }
                            }}
                        >
                            <span>{tab.label}</span>
                            {tab.hint && (
                                <span
                                    className="mono"
                                    style={{
                                        fontSize: 10.5,
                                        color: 'var(--text-faint)',
                                        letterSpacing: '0.04em',
                                    }}
                                >
                                    {tab.hint}
                                </span>
                            )}
                        </button>
                    );
                })}
            </nav>

            <div style={{ flex: 1, minWidth: 0 }}>
                {header}
                <div>{active.render()}</div>
            </div>
        </div>
    );
}

function readHash(): string | null {
    const h = window.location.hash;
    if (!h || h.length < 2) return null;
    return h.slice(1);
}
