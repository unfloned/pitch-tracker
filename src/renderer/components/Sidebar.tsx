import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { ROUTES, type RoutePath } from '../routes';
import { Kbd } from './primitives/Kbd';
import { Label } from './primitives/Label';

interface NavItem {
    path: RoutePath;
    /** 3-5 char mono icon text in place of vector icons. */
    tag: string;
    labelKey: string;
    count?: number;
    shortcut?: string;
}

interface Props {
    applicationsCount: number;
    candidatesCount: number;
}

function SidebarItem({
    tag,
    label,
    count,
    active,
    shortcut,
    onClick,
}: {
    tag: string;
    label: string;
    count?: number;
    active: boolean;
    shortcut?: string;
    onClick: () => void;
}) {
    return (
        <div
            onClick={onClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.77em',
                minHeight: '2em',
                padding: '0.2em 0.77em',
                marginInline: 6,
                borderRadius: 3,
                background: active ? 'var(--paper-3)' : 'transparent',
                color: active ? 'var(--ink)' : 'var(--ink-2)',
                cursor: 'pointer',
                borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
                paddingLeft: active ? '0.62em' : '0.77em',
                transition: 'background 80ms',
            }}
            onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.background = 'rgba(0,0,0,0.03)';
            }}
            onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = 'transparent';
            }}
        >
            <span
                className="mono"
                style={{
                    width: '2.9em',
                    fontSize: '0.73em',
                    letterSpacing: '0.06em',
                    fontWeight: 600,
                    color: active ? 'var(--ink-2)' : 'var(--ink-4)',
                }}
            >
                {tag}
            </span>
            <span
                style={{
                    fontSize: '0.96em',
                    fontWeight: active ? 600 : 500,
                    flex: 1,
                }}
            >
                {label}
            </span>
            {count !== undefined && count > 0 && (
                <span
                    className="mono tnum"
                    style={{
                        fontSize: '0.77em',
                        color: active ? 'var(--ink-2)' : 'var(--ink-3)',
                        fontWeight: 500,
                    }}
                >
                    {count}
                </span>
            )}
            {shortcut && (
                <Kbd
                    style={{
                        fontSize: '0.77em',
                        minWidth: '1.4em',
                        height: '1.4em',
                        padding: '0 0.4em',
                    }}
                >
                    {shortcut}
                </Kbd>
            )}
        </div>
    );
}

function SidebarGroup({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div style={{ marginTop: 14 }}>
            <div style={{ padding: '0 14px 4px' }}>
                <Label style={{ fontSize: '0.77em' }}>{label}</Label>
            </div>
            {children}
        </div>
    );
}

export function Sidebar({ applicationsCount, candidatesCount }: Props) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const currentPath = location.pathname;
    const [ollamaRunning, setOllamaRunning] = useState<boolean | null>(null);

    useEffect(() => {
        const check = async () => {
            try {
                const status = await window.api.llm.status();
                setOllamaRunning(status.running);
            } catch {
                setOllamaRunning(false);
            }
        };
        check();
        const interval = setInterval(check, 30000);
        return () => clearInterval(interval);
    }, []);

    const items: NavItem[] = [
        { path: ROUTES.dashboard,    tag: 'INBOX',  labelKey: 'nav.inbox',           shortcut: '⌘1' },
        { path: ROUTES.applications, tag: 'APPS',   labelKey: 'tabs.applications',   count: applicationsCount,          shortcut: '⌘2' },
        { path: ROUTES.candidates,   tag: 'CAND',   labelKey: 'tabs.candidates',     count: candidatesCount,            shortcut: '⌘3' },
        { path: ROUTES.inbox,        tag: 'MAIL',   labelKey: 'nav.mail',            shortcut: '⌘4' },
        { path: ROUTES.agents,       tag: 'AGENT',  labelKey: 'nav.agents',          shortcut: '⌘5' },
        { path: ROUTES.chat,         tag: 'ASSIST', labelKey: 'nav.chat',            shortcut: '⌘6' },
        { path: ROUTES.analytics,    tag: 'ANLY',   labelKey: 'nav.analytics',       shortcut: '⌘7' },
    ];

    const isActive = (path: string) =>
        currentPath === path || (path === ROUTES.dashboard && currentPath === '/');

    return (
        <div
            className="sidebar-root"
            style={{
                background: 'var(--paper)',
                borderRight: '1px solid var(--rule-strong)',
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0,
            }}
        >
            <div
                style={{
                    padding: '14px 16px 10px',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span
                        className="serif"
                        style={{
                            fontSize: '1.54em',
                            fontWeight: 600,
                            color: 'var(--ink)',
                            letterSpacing: '-0.01em',
                        }}
                    >
                        {t('app.titleShort')}
                        <span style={{ color: 'var(--accent-ink)' }}>.</span>
                    </span>
                </div>
                <div
                    className="mono"
                    style={{
                        fontSize: '0.77em',
                        color: 'var(--ink-3)',
                        marginTop: 2,
                        letterSpacing: '0.04em',
                    }}
                >
                    local · offline · yours
                </div>
            </div>

            <SidebarGroup label={t('nav.section.main')}>
                {items.map((item) => (
                    <SidebarItem
                        key={item.path}
                        tag={item.tag}
                        label={t(item.labelKey)}
                        count={item.count}
                        shortcut={item.shortcut}
                        active={isActive(item.path)}
                        onClick={() => navigate(item.path)}
                    />
                ))}
            </SidebarGroup>

            <div style={{ flex: 1 }} />

            <SidebarItem
                tag="SET"
                label={t('toolbar.settings')}
                active={isActive(ROUTES.settings)}
                shortcut="⌘,"
                onClick={() => navigate(ROUTES.settings)}
            />

        </div>
    );
}
