import {
    IconBriefcase,
    IconChartBar,
    IconInbox,
    IconMail,
    IconMessage,
    IconRobot,
    IconSettings,
    IconSparkles,
} from '@tabler/icons-react';
import { ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { ROUTES, type RoutePath } from '../routes';
import { Kbd } from './primitives/Kbd';

interface NavItem {
    path: RoutePath;
    icon: ReactNode;
    labelKey: string;
    count?: number;
    shortcut?: string;
}

interface Props {
    applicationsCount: number;
    candidatesCount: number;
}

function SidebarItem({
    icon,
    label,
    count,
    active,
    shortcut,
    onClick,
}: {
    icon: ReactNode;
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
                gap: '0.7em',
                minHeight: '2em',
                padding: '0.4em 0.7em',
                marginInline: 6,
                borderRadius: 6,
                background: active ? 'var(--surface)' : 'transparent',
                color: active ? 'var(--text)' : 'var(--text-muted)',
                fontWeight: active ? 500 : 450,
                cursor: 'pointer',
                transition: 'background 100ms, color 100ms',
            }}
            onMouseEnter={(e) => {
                if (!active) {
                    e.currentTarget.style.background = 'var(--surface)';
                    e.currentTarget.style.color = 'var(--text)';
                }
            }}
            onMouseLeave={(e) => {
                if (!active) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-muted)';
                }
            }}
        >
            <span
                style={{
                    width: '1.3em',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: active ? 'var(--accent)' : 'var(--text-faint)',
                    flexShrink: 0,
                }}
            >
                {icon}
            </span>
            <span
                style={{
                    fontSize: '0.96em',
                    flex: 1,
                }}
            >
                {label}
            </span>
            {count !== undefined && count > 0 && (
                <span
                    className="mono tnum"
                    style={{
                        fontSize: '0.78em',
                        color: active ? 'var(--accent)' : 'var(--text-faint)',
                        fontWeight: 500,
                    }}
                >
                    {count}
                </span>
            )}
            {shortcut && (
                <Kbd
                    style={{
                        fontSize: '0.74em',
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

function SidebarSection({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div style={{ marginTop: 18 }}>
            <div
                style={{
                    padding: '0 14px 6px',
                    fontSize: '0.78em',
                    fontWeight: 500,
                    color: 'var(--text-faint)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                }}
            >
                {label}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {children}
            </div>
        </div>
    );
}

const ICON_SIZE = 15;

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

    const today: NavItem[] = [
        { path: ROUTES.dashboard, icon: <IconInbox size={ICON_SIZE} />, labelKey: 'nav.inbox', shortcut: '⌘1' },
        { path: ROUTES.inbox,     icon: <IconMail size={ICON_SIZE} />,  labelKey: 'nav.mail',  shortcut: '⌘4' },
    ];

    const pipeline: NavItem[] = [
        { path: ROUTES.applications, icon: <IconBriefcase size={ICON_SIZE} />, labelKey: 'tabs.applications', count: applicationsCount, shortcut: '⌘2' },
        { path: ROUTES.candidates,   icon: <IconSparkles size={ICON_SIZE} />,  labelKey: 'tabs.candidates',   count: candidatesCount,   shortcut: '⌘3' },
        { path: ROUTES.agents,       icon: <IconRobot size={ICON_SIZE} />,     labelKey: 'nav.agents',        shortcut: '⌘5' },
    ];

    const more: NavItem[] = [
        { path: ROUTES.chat,      icon: <IconMessage size={ICON_SIZE} />,  labelKey: 'nav.chat',      shortcut: '⌘6' },
        { path: ROUTES.analytics, icon: <IconChartBar size={ICON_SIZE} />, labelKey: 'nav.analytics', shortcut: '⌘7' },
    ];

    const isActive = (path: string) =>
        currentPath === path || (path === ROUTES.dashboard && currentPath === '/');

    return (
        <div
            className="sidebar-root"
            style={{
                background: 'var(--bg)',
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0,
            }}
        >
            <div
                style={{
                    padding: '16px 20px 4px',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: 2,
                        fontWeight: 600,
                        fontSize: '15px',
                        letterSpacing: '-0.02em',
                        color: 'var(--text)',
                    }}
                >
                    {t('app.titleShort')}
                    <span style={{ color: 'var(--accent)' }}>.</span>
                </div>
                <div
                    className="mono"
                    style={{
                        fontSize: '0.74em',
                        color: 'var(--text-faint)',
                        marginTop: 4,
                        letterSpacing: '0.04em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                    }}
                >
                    <span
                        style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: ollamaRunning ? 'var(--success)' : 'var(--text-faint)',
                            display: 'inline-block',
                        }}
                    />
                    {ollamaRunning === null
                        ? 'connecting…'
                        : ollamaRunning
                          ? 'ollama · ready'
                          : 'ollama · offline'}
                </div>
            </div>

            <SidebarSection label={t('nav.section.main')}>
                {today.map((item) => (
                    <SidebarItem
                        key={item.path}
                        icon={item.icon}
                        label={t(item.labelKey)}
                        count={item.count}
                        shortcut={item.shortcut}
                        active={isActive(item.path)}
                        onClick={() => navigate(item.path)}
                    />
                ))}
            </SidebarSection>

            <SidebarSection label="Pipeline">
                {pipeline.map((item) => (
                    <SidebarItem
                        key={item.path}
                        icon={item.icon}
                        label={t(item.labelKey)}
                        count={item.count}
                        shortcut={item.shortcut}
                        active={isActive(item.path)}
                        onClick={() => navigate(item.path)}
                    />
                ))}
            </SidebarSection>

            <SidebarSection label="Mehr">
                {more.map((item) => (
                    <SidebarItem
                        key={item.path}
                        icon={item.icon}
                        label={t(item.labelKey)}
                        shortcut={item.shortcut}
                        active={isActive(item.path)}
                        onClick={() => navigate(item.path)}
                    />
                ))}
            </SidebarSection>

            <div style={{ flex: 1 }} />

            <div style={{ padding: '8px 0 12px' }}>
                <SidebarItem
                    icon={<IconSettings size={ICON_SIZE} />}
                    label={t('toolbar.settings')}
                    active={isActive(ROUTES.settings)}
                    shortcut="⌘,"
                    onClick={() => navigate(ROUTES.settings)}
                />
            </div>
        </div>
    );
}
