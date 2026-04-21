import '@mantine/charts/styles.css';
import { BarChart, DonutChart, LineChart } from '@mantine/charts';
import { Card, Group, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { IconChartBar } from '@tabler/icons-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { STATUS_ORDER, type ApplicationStatus } from '@shared/application';
import type { ApplicationRecord } from '../../preload/index';

interface Props {
    applications: ApplicationRecord[];
}

const STATUS_COLORS: Record<ApplicationStatus, string> = {
    draft: 'gray',
    applied: 'blue',
    in_review: 'cyan',
    interview_scheduled: 'indigo',
    interviewed: 'violet',
    offer_received: 'teal',
    accepted: 'green',
    rejected: 'red',
    withdrawn: 'gray',
};

function startOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = (day + 6) % 7;
    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

function formatWeek(date: Date): string {
    return `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function AnalyticsPage({ applications }: Props) {
    const { t } = useTranslation();

    const total = applications.length;
    const active = applications.filter(
        (a) => !['rejected', 'withdrawn', 'accepted'].includes(a.status),
    ).length;
    const scored = applications.filter((a) => a.matchScore > 0);
    const avgMatch = scored.length
        ? Math.round(scored.reduce((s, a) => s + a.matchScore, 0) / scored.length)
        : 0;
    const offersCount = applications.filter(
        (a) => a.status === 'offer_received' || a.status === 'accepted',
    ).length;

    const statusData = useMemo(() => {
        const counts: Record<ApplicationStatus, number> = {
            draft: 0,
            applied: 0,
            in_review: 0,
            interview_scheduled: 0,
            interviewed: 0,
            offer_received: 0,
            accepted: 0,
            rejected: 0,
            withdrawn: 0,
        };
        for (const a of applications) counts[a.status] = (counts[a.status] ?? 0) + 1;
        return STATUS_ORDER.filter((s) => counts[s] > 0).map((s) => ({
            name: t(`status.${s}`),
            value: counts[s],
            color: STATUS_COLORS[s],
        }));
    }, [applications, t]);

    const weeklyData = useMemo(() => {
        const buckets = new Map<string, number>();
        const now = new Date();
        const twelveWeeksAgo = startOfWeek(new Date(now.getTime() - 12 * 7 * 24 * 3600 * 1000));

        for (let i = 0; i < 12; i++) {
            const weekStart = new Date(twelveWeeksAgo.getTime() + i * 7 * 24 * 3600 * 1000);
            buckets.set(formatWeek(weekStart), 0);
        }

        for (const a of applications) {
            if (!a.createdAt) continue;
            const created = new Date(a.createdAt);
            if (created < twelveWeeksAgo) continue;
            const weekKey = formatWeek(startOfWeek(created));
            if (buckets.has(weekKey)) {
                buckets.set(weekKey, (buckets.get(weekKey) ?? 0) + 1);
            }
        }
        return Array.from(buckets.entries()).map(([week, count]) => ({ week, count }));
    }, [applications]);

    const matchDistribution = useMemo(() => {
        const ranges: Array<{ range: string; count: number }> = [
            { range: '0-49', count: 0 },
            { range: '50-69', count: 0 },
            { range: '70-89', count: 0 },
            { range: '90-100', count: 0 },
        ];
        for (const a of applications) {
            if (a.matchScore <= 0) continue;
            if (a.matchScore < 50) ranges[0].count += 1;
            else if (a.matchScore < 70) ranges[1].count += 1;
            else if (a.matchScore < 90) ranges[2].count += 1;
            else ranges[3].count += 1;
        }
        return ranges;
    }, [applications]);

    const remoteData = useMemo(() => {
        const counts: Record<string, number> = { onsite: 0, hybrid: 0, remote: 0 };
        for (const a of applications) counts[a.remote] = (counts[a.remote] ?? 0) + 1;
        return [
            { name: t('remote.onsite'), value: counts.onsite, color: 'gray' },
            { name: t('remote.hybrid'), value: counts.hybrid, color: 'blue' },
            { name: t('remote.remote'), value: counts.remote, color: 'teal' },
        ].filter((d) => d.value > 0);
    }, [applications, t]);

    return (
        <Stack gap="xl">
            <Group gap="xs">
                <IconChartBar size={22} />
                <Title order={2}>{t('analytics.title')}</Title>
            </Group>

            <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
                <KpiCard label={t('analytics.totalApplications')} value={total} />
                <KpiCard label={t('analytics.activeApplications')} value={active} />
                <KpiCard
                    label={t('analytics.avgMatchScore')}
                    value={avgMatch > 0 ? `${avgMatch}/100` : '-'}
                />
                <KpiCard label={t('analytics.offersReceived')} value={offersCount} />
            </SimpleGrid>

            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                <Card withBorder padding="lg">
                    <Title order={5} mb="md">
                        {t('analytics.applicationsPerWeek')}
                    </Title>
                    {applications.length > 0 ? (
                        <LineChart
                            h={240}
                            data={weeklyData}
                            dataKey="week"
                            series={[{ name: 'count', color: 'accent.6', label: t('analytics.entries') }]}
                            curveType="monotone"
                            withDots
                        />
                    ) : (
                        <EmptyHint />
                    )}
                </Card>

                <Card withBorder padding="lg">
                    <Title order={5} mb="md">
                        {t('analytics.statusBreakdown')}
                    </Title>
                    {statusData.length > 0 ? (
                        <Group justify="center">
                            <DonutChart
                                h={240}
                                data={statusData}
                                chartLabel={total}
                                withLabels={false}
                                tooltipDataSource="segment"
                            />
                        </Group>
                    ) : (
                        <EmptyHint />
                    )}
                </Card>

                <Card withBorder padding="lg">
                    <Title order={5} mb="md">
                        {t('analytics.matchDistribution')}
                    </Title>
                    {scored.length > 0 ? (
                        <BarChart
                            h={240}
                            data={matchDistribution}
                            dataKey="range"
                            series={[
                                { name: 'count', color: 'accent.6', label: t('analytics.entries') },
                            ]}
                        />
                    ) : (
                        <EmptyHint text={t('analytics.matchDistributionEmpty')} />
                    )}
                </Card>

                <Card withBorder padding="lg">
                    <Title order={5} mb="md">
                        {t('analytics.remoteBreakdown')}
                    </Title>
                    {remoteData.length > 0 ? (
                        <Group justify="center">
                            <DonutChart
                                h={240}
                                data={remoteData}
                                withLabels={false}
                                tooltipDataSource="segment"
                            />
                        </Group>
                    ) : (
                        <EmptyHint />
                    )}
                </Card>
            </SimpleGrid>
        </Stack>
    );
}

function KpiCard({ label, value }: { label: string; value: number | string }) {
    return (
        <Paper withBorder p="md" radius="md">
            <Text size="xs" c="dimmed" fw={500} tt="uppercase" mb={4}>
                {label}
            </Text>
            <Text size="xl" fw={700}>
                {value}
            </Text>
        </Paper>
    );
}

function EmptyHint({ text }: { text?: string } = {}) {
    const { t } = useTranslation();
    return (
        <Text c="dimmed" size="sm" ta="center" py="xl">
            {text ?? t('analytics.empty')}
        </Text>
    );
}
