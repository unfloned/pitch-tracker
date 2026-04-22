import { Menu, UnstyledButton } from '@mantine/core';
import { IconChevronDown } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { ApplicationStatus, STATUS_ORDER } from '@shared/application';
import { StageGlyph } from './primitives/StageGlyph';

interface Props {
    value: ApplicationStatus;
    onChange: (status: ApplicationStatus) => void;
    compact?: boolean;
}

/** Paper-style status picker. StageGlyph + label + tiny chevron. */
export function StatusSelector({ value, onChange, compact = false }: Props) {
    const { t } = useTranslation();

    return (
        <Menu position="bottom-start" shadow="md" width={200}>
            <Menu.Target>
                <UnstyledButton
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: compact ? '2px 6px' : '4px 8px',
                        border: '1px solid var(--rule)',
                        background: 'var(--card)',
                        color: 'var(--ink-2)',
                        fontSize: compact ? 11 : 12,
                        fontWeight: 500,
                        fontFamily: 'var(--f-ui)',
                        borderRadius: 3,
                        cursor: 'pointer',
                        maxWidth: '100%',
                        minWidth: 0,
                        overflow: 'hidden',
                        transition: 'background 100ms, border-color 100ms',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--paper-2)';
                        e.currentTarget.style.borderColor = 'var(--rule-strong)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--card)';
                        e.currentTarget.style.borderColor = 'var(--rule)';
                    }}
                >
                    <StageGlyph status={value} size={compact ? 9 : 10} />
                    <span
                        style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            minWidth: 0,
                            flex: 1,
                        }}
                    >
                        {t(`status.${value}`)}
                    </span>
                    <IconChevronDown
                        size={10}
                        style={{ opacity: 0.5, flexShrink: 0, color: 'var(--ink-3)' }}
                    />
                </UnstyledButton>
            </Menu.Target>

            <Menu.Dropdown>
                {STATUS_ORDER.map((status) => {
                    const isActive = status === value;
                    return (
                        <Menu.Item
                            key={status}
                            onClick={() => onChange(status)}
                            leftSection={<StageGlyph status={status} size={9} />}
                            style={
                                isActive
                                    ? {
                                          background: 'var(--paper-2)',
                                          fontWeight: 600,
                                      }
                                    : undefined
                            }
                        >
                            <span style={{ fontSize: 12.5 }}>{t(`status.${status}`)}</span>
                        </Menu.Item>
                    );
                })}
            </Menu.Dropdown>
        </Menu>
    );
}
