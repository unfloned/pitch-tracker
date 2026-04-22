import { Box, SimpleGrid, Stack, Text } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { JobSource } from '@shared/job-search';
import { ALL_JOB_SOURCES } from '@shared/job-search';

const SOURCE_EMOJI: Record<JobSource, string> = {
    germantechjobs: '🇩🇪',
    remotive: '🌍',
    arbeitnow: '🇩🇪',
    remoteok: '🌐',
    weworkremotely: '💼',
    hackernews: '🧡',
    indeed: '🔍',
    url: '🔗',
};

interface Props {
    value: JobSource[];
    onChange: (sources: JobSource[]) => void;
    columns?: number;
}

export function SourceGrid({ value, onChange, columns = 2 }: Props) {
    const { t } = useTranslation();

    const toggle = (source: JobSource) => {
        if (value.includes(source)) {
            onChange(value.filter((s) => s !== source));
        } else {
            onChange([...value, source]);
        }
    };

    return (
        <SimpleGrid cols={{ base: 1, sm: columns }} spacing="xs">
            {ALL_JOB_SOURCES.map((source) => {
                const active = value.includes(source);
                return (
                    <Box
                        key={source}
                        onClick={() => toggle(source)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                toggle(source);
                            }
                        }}
                        style={{
                            cursor: 'pointer',
                            padding: 12,
                            border: `1px solid ${active ? 'var(--ink)' : 'var(--rule-strong)'}`,
                            background: active ? 'var(--paper-2)' : 'var(--card)',
                            transition: 'border-color 120ms, background 120ms',
                            position: 'relative',
                        }}
                    >
                        {active && (
                            <Box
                                style={{
                                    position: 'absolute',
                                    top: 6,
                                    right: 6,
                                    width: 18,
                                    height: 18,
                                    borderRadius: '50%',
                                    backgroundColor: 'var(--mantine-color-accent-5)',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <IconCheck size={12} stroke={3} />
                            </Box>
                        )}
                        <Stack gap={4}>
                            <Text size="sm" fw={600}>
                                <span style={{ marginRight: 6 }}>{SOURCE_EMOJI[source]}</span>
                                {t(`source.${source}`).split(' (')[0]}
                            </Text>
                            <Text size="xs" c="dimmed" lineClamp={2}>
                                {t(`sourceDesc.${source}`)}
                            </Text>
                        </Stack>
                    </Box>
                );
            })}
        </SimpleGrid>
    );
}
