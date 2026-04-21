import {
    ActionIcon,
    Badge,
    Box,
    Button,
    Group,
    SimpleGrid,
    Stack,
    Text,
    Title,
    Tooltip,
    UnstyledButton,
} from '@mantine/core';
import {
    IconArrowRight,
    IconCalendarClock,
    IconCheck,
    IconClock,
    IconMailQuestion,
    IconSparkles,
    IconTargetArrow,
    IconTrendingUp,
    IconX,
} from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ApplicationRecord } from '../../preload/index';
import type { SerializedJobCandidate } from '@shared/job-search';

type PageKey = 'dashboard' | 'applications' | 'candidates' | 'agents' | 'settings';

interface Props {
    applications: ApplicationRecord[];
    onNavigate: (page: PageKey) => void;
    onNewEntry: () => void;
    onQuickAdd: () => void;
    onExport: () => void;
    onOpenApplication: (app: ApplicationRecord) => void;
}

function scoreColor(score: number): string {
    if (score >= 90) return 'teal';
    if (score >= 70) return 'green';
    if (score >= 50) return 'yellow';
    if (score > 0) return 'orange';
    return 'gray';
}

function ActionRow({
    icon,
    iconColor,
    title,
    subtitle,
    rightLabel,
    rightColor,
    onClick,
}: {
    icon: React.ReactNode;
    iconColor: string;
    title: string;
    subtitle?: string;
    rightLabel?: string;
    rightColor?: string;
    onClick: () => void;
}) {
    return (
        <UnstyledButton
            onClick={onClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                borderRadius: 8,
                width: '100%',
                transition: 'background 120ms',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                    'light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-6))';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
            }}
        >
            <Box
                w={32}
                h={32}
                style={{
                    borderRadius: 6,
                    backgroundColor: `var(--mantine-color-${iconColor}-1)`,
                    color: `var(--mantine-color-${iconColor}-7)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}
            >
                {icon}
            </Box>
            <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
                <Text size="sm" fw={500} lineClamp={1}>
                    {title}
                </Text>
                {subtitle && (
                    <Text size="xs" c="dimmed" lineClamp={1}>
                        {subtitle}
                    </Text>
                )}
            </Stack>
            {rightLabel && (
                <Badge size="sm" variant="light" color={rightColor || 'gray'}>
                    {rightLabel}
                </Badge>
            )}
            <IconArrowRight size={14} style={{ opacity: 0.3 }} />
        </UnstyledButton>
    );
}

function SectionHeader({ title, count }: { title: string; count?: number }) {
    return (
        <Group gap={8} mb="xs">
            <Text size="xs" fw={600} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
                {title}
            </Text>
            {count !== undefined && count > 0 && (
                <Badge size="xs" variant="light" color="gray">
                    {count}
                </Badge>
            )}
        </Group>
    );
}

function StatTile({
    label,
    value,
    icon,
    color = 'gray',
    onClick,
}: {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    color?: string;
    onClick?: () => void;
}) {
    const body = (
        <Box
            p="md"
            style={{
                borderRadius: 10,
                border: '1px solid light-dark(var(--mantine-color-gray-2), var(--mantine-color-dark-5))',
                backgroundColor:
                    'light-dark(white, var(--mantine-color-dark-7))',
                height: '100%',
            }}
        >
            <Group justify="space-between" mb={6}>
                <Text size="xs" c="dimmed" fw={500}>
                    {label}
                </Text>
                <Box style={{ color: `var(--mantine-color-${color}-5)`, opacity: 0.7 }}>{icon}</Box>
            </Group>
            <Text size="xl" fw={700} style={{ lineHeight: 1 }}>
                {value}
            </Text>
        </Box>
    );
    if (onClick) {
        return (
            <UnstyledButton onClick={onClick} style={{ width: '100%', textAlign: 'left' }}>
                {body}
            </UnstyledButton>
        );
    }
    return body;
}

export function DashboardPage({
    applications,
    onNavigate,
    onNewEntry,
    onOpenApplication,
}: Props) {
    const { t } = useTranslation();
    const [candidates, setCandidates] = useState<SerializedJobCandidate[]>([]);

    useEffect(() => {
        window.api.agents.listCandidates(0).then(setCandidates).catch(() => { });
    }, []);

    const data = useMemo(() => {
        const total = applications.length;
        const applied = applications.filter((a) => a.status === 'applied').length;
        const interviewing = applications.filter(
            (a) =>
                a.status === 'interview_scheduled' ||
                a.status === 'interviewed' ||
                a.status === 'offer_received',
        ).length;
        const accepted = applications.filter((a) => a.status === 'accepted').length;
        const rejected = applications.filter((a) => a.status === 'rejected').length;
        const scored = applications.filter((a) => a.matchScore > 0);
        const avgMatch =
            scored.length > 0
                ? Math.round(scored.reduce((s, a) => s + a.matchScore, 0) / scored.length)
                : 0;

        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const followUps = applications.filter(
            (a) =>
                a.status === 'applied' &&
                a.appliedAt &&
                new Date(a.appliedAt).getTime() < sevenDaysAgo,
        );

        const pendingOffers = applications.filter((a) => a.status === 'offer_received');
        const interviewsSoon = applications.filter(
            (a) => a.status === 'interview_scheduled' || a.status === 'interviewed',
        );

        const newCandidates = candidates.filter((c) => c.status === 'new').slice(0, 5);
        const topCandidates = [...newCandidates].sort((a, b) => b.score - a.score);

        const actionCount =
            followUps.length + pendingOffers.length + interviewsSoon.length + newCandidates.length;

        return {
            total,
            applied,
            interviewing,
            accepted,
            rejected,
            avgMatch,
            followUps,
            pendingOffers,
            interviewsSoon,
            topCandidates,
            actionCount,
            newCandidatesCount: newCandidates.length,
        };
    }, [applications, candidates]);

    const recentActivity = useMemo(
        () =>
            [...applications]
                .sort(
                    (a, b) =>
                        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
                )
                .slice(0, 6),
        [applications],
    );

    if (applications.length === 0 && candidates.length === 0) {
        return (
            <Stack mih={500} align="center" justify="center" gap="md">
                <Box
                    w={56}
                    h={56}
                    style={{
                        borderRadius: 14,
                        background:
                            'linear-gradient(135deg, var(--mantine-color-accent-5) 0%, var(--mantine-color-accent-7) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                    }}
                >
                    <IconSparkles size={28} />
                </Box>
                <Stack align="center" gap={4} maw={420}>
                    <Title order={3}>{t('dashboard.welcomeTitle')}</Title>
                    <Text c="dimmed" ta="center" size="sm">
                        {t('dashboard.welcomeSubtitle')}
                    </Text>
                </Stack>
                <Group>
                    <Button onClick={onNewEntry}>{t('toolbar.newEntry')}</Button>
                    <Button
                        variant="subtle"
                        onClick={() => onNavigate('agents')}
                    >
                        {t('nav.agents')}
                    </Button>
                </Group>
            </Stack>
        );
    }

    return (
        <Stack gap="xl" maw={960}>
            <Stack gap={2}>
                <Title order={2}>{t('dashboard.title')}</Title>
                <Text c="dimmed" size="sm">
                    {t('dashboard.subtitle')}
                </Text>
            </Stack>

            <Box>
                <SectionHeader title={t('dashboard.sectionToday')} count={data.actionCount} />
                {data.actionCount === 0 ? (
                    <Box
                        p="lg"
                        style={{
                            borderRadius: 10,
                            border:
                                '1px solid light-dark(var(--mantine-color-gray-2), var(--mantine-color-dark-5))',
                            textAlign: 'center',
                        }}
                    >
                        <Group justify="center" gap="xs">
                            <IconCheck size={18} color="var(--mantine-color-green-5)" />
                            <Text size="sm" fw={500}>
                                {t('dashboard.allClearTitle')}
                            </Text>
                        </Group>
                        <Text size="xs" c="dimmed" mt={4}>
                            {t('dashboard.allClearSubtitle')}
                        </Text>
                    </Box>
                ) : (
                    <Stack
                        gap={2}
                        p={6}
                        style={{
                            borderRadius: 10,
                            border:
                                '1px solid light-dark(var(--mantine-color-gray-2), var(--mantine-color-dark-5))',
                            backgroundColor:
                                'light-dark(white, var(--mantine-color-dark-7))',
                        }}
                    >
                        {data.pendingOffers.map((app) => (
                            <ActionRow
                                key={`offer-${app.id}`}
                                icon={<IconTargetArrow size={16} />}
                                iconColor="teal"
                                title={`${app.companyName || '-'} - ${app.jobTitle || '-'}`}
                                subtitle={t('dashboard.pendingDecision')}
                                rightLabel={t('status.offer_received')}
                                rightColor="teal"
                                onClick={() => onOpenApplication(app)}
                            />
                        ))}
                        {data.interviewsSoon.map((app) => (
                            <ActionRow
                                key={`int-${app.id}`}
                                icon={<IconCalendarClock size={16} />}
                                iconColor="violet"
                                title={`${app.companyName || '-'} - ${app.jobTitle || '-'}`}
                                subtitle={t('dashboard.interviewsSoon')}
                                rightLabel={t(`status.${app.status}`)}
                                rightColor="violet"
                                onClick={() => onOpenApplication(app)}
                            />
                        ))}
                        {data.followUps.slice(0, 5).map((app) => {
                            const days = Math.floor(
                                (Date.now() - new Date(app.appliedAt!).getTime()) /
                                    (24 * 60 * 60 * 1000),
                            );
                            return (
                                <ActionRow
                                    key={`fu-${app.id}`}
                                    icon={<IconMailQuestion size={16} />}
                                    iconColor="yellow"
                                    title={`${app.companyName || '-'} - ${app.jobTitle || '-'}`}
                                    subtitle={t('dashboard.followUpsHint')}
                                    rightLabel={`${days}d`}
                                    rightColor="yellow"
                                    onClick={() => onOpenApplication(app)}
                                />
                            );
                        })}
                        {data.topCandidates.slice(0, 5).map((c) => (
                            <ActionRow
                                key={`c-${c.id}`}
                                icon={<IconSparkles size={16} />}
                                iconColor="accent"
                                title={c.title || c.company || 'Untitled'}
                                subtitle={c.company}
                                rightLabel={`${c.score}`}
                                rightColor={scoreColor(c.score)}
                                onClick={() => onNavigate('candidates')}
                            />
                        ))}
                    </Stack>
                )}
            </Box>

            <Box>
                <SectionHeader title={t('dashboard.sectionStats')} />
                <SimpleGrid cols={{ base: 2, sm: 3, md: 5 }} spacing="sm">
                    <StatTile
                        label={t('dashboard.total')}
                        value={data.total}
                        icon={<IconClock size={14} />}
                        onClick={() => onNavigate('applications')}
                    />
                    <StatTile
                        label={t('dashboard.applied')}
                        value={data.applied}
                        icon={<IconMailQuestion size={14} />}
                        color="blue"
                    />
                    <StatTile
                        label={t('dashboard.interviewing')}
                        value={data.interviewing}
                        icon={<IconCalendarClock size={14} />}
                        color="violet"
                    />
                    <StatTile
                        label={t('dashboard.accepted')}
                        value={data.accepted}
                        icon={<IconCheck size={14} />}
                        color="green"
                    />
                    <StatTile
                        label={t('dashboard.avgMatch')}
                        value={data.avgMatch > 0 ? data.avgMatch : t('dashboard.emptyStat')}
                        icon={<IconTrendingUp size={14} />}
                        color="teal"
                    />
                </SimpleGrid>
            </Box>

            {recentActivity.length > 0 && (
                <Box>
                    <SectionHeader title={t('dashboard.sectionActivity')} />
                    <Stack
                        gap={0}
                        p={4}
                        style={{
                            borderRadius: 10,
                            border:
                                '1px solid light-dark(var(--mantine-color-gray-2), var(--mantine-color-dark-5))',
                            backgroundColor:
                                'light-dark(white, var(--mantine-color-dark-7))',
                        }}
                    >
                        {recentActivity.map((app) => (
                            <UnstyledButton
                                key={app.id}
                                onClick={() => onOpenApplication(app)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '8px 12px',
                                    borderRadius: 6,
                                    transition: 'background 120ms',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                        'light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-6))';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                            >
                                <Stack gap={0} style={{ minWidth: 0 }}>
                                    <Text size="sm" fw={500} lineClamp={1}>
                                        {app.companyName || '-'}
                                    </Text>
                                    <Text size="xs" c="dimmed" lineClamp={1}>
                                        {app.jobTitle || '-'}
                                    </Text>
                                </Stack>
                                <Group gap="xs" wrap="nowrap">
                                    <Badge size="xs" variant="light">
                                        {t(`status.${app.status}`)}
                                    </Badge>
                                    <Text size="xs" c="dimmed" style={{ minWidth: 70, textAlign: 'right' }}>
                                        {new Date(app.updatedAt).toLocaleDateString()}
                                    </Text>
                                </Group>
                            </UnstyledButton>
                        ))}
                    </Stack>
                </Box>
            )}
        </Stack>
    );
}
