import { Tooltip } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { RunningAgent } from './useRunningAgents';

interface Props {
    running: RunningAgent[];
    onClick?: () => void;
}

/**
 * Inline status pill that surfaces active agent runs on the Vorschläge page,
 * so the user knows new candidates may still arrive. Hidden when no agent is
 * running. Pulse-animated dot mirrors the StatusFooter's accent treatment.
 */
export function RunningAgentsBadge({ running, onClick }: Props) {
    const { t } = useTranslation();
    if (running.length === 0) return null;

    const label =
        running.length === 1
            ? t('candidates.agentRunningOne', {
                  name: running[0].label,
                  defaultValue: '{{name}} läuft',
              })
            : t('candidates.agentRunningMany', {
                  count: running.length,
                  defaultValue: '{{count}} Agenten laufen',
              });

    const tooltipContent = running.map((r) => r.label).join(' · ');

    return (
        <Tooltip label={tooltipContent} withArrow>
            <button
                type="button"
                onClick={onClick}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '3px 9px',
                    background: 'var(--card)',
                    border: '1px solid var(--rule)',
                    borderLeft: '2px solid var(--accent)',
                    fontFamily: 'var(--f-ui)',
                    fontSize: 11,
                    fontWeight: 500,
                    color: 'var(--ink-2)',
                    cursor: onClick ? 'pointer' : 'default',
                    borderRadius: 3,
                }}
            >
                <span
                    style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: 'var(--accent)',
                        animation: 'agent-pulse 1.4s ease-in-out infinite',
                    }}
                />
                <span>{label}</span>
            </button>
        </Tooltip>
    );
}
