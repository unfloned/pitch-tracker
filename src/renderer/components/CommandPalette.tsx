import { Spotlight, spotlight, type SpotlightActionData } from '@mantine/spotlight';
import '@mantine/spotlight/styles.css';
import {
    IconBriefcase,
    IconDownload,
    IconInbox,
    IconPlayerPlay,
    IconPlus,
    IconRobot,
    IconSearch,
    IconSettings,
    IconSparkles,
} from '@tabler/icons-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';

interface Props {
    onNewEntry: () => void;
    onExport: () => void;
    onQuickAdd: () => void;
}

export { spotlight };

export function CommandPalette({ onNewEntry, onExport, onQuickAdd }: Props) {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const actions = useMemo<SpotlightActionData[]>(
        () => [
            {
                id: 'nav-dashboard',
                label: t('nav.inbox'),
                description: t('cmd.goToDashboard'),
                onClick: () => navigate(ROUTES.dashboard),
                leftSection: <IconInbox size={18} />,
                keywords: ['dashboard', 'inbox', 'home', 'start'],
            },
            {
                id: 'nav-applications',
                label: t('tabs.applications'),
                description: t('cmd.goToApplications'),
                onClick: () => navigate(ROUTES.applications),
                leftSection: <IconBriefcase size={18} />,
                keywords: ['applications', 'bewerbungen', 'list'],
            },
            {
                id: 'nav-candidates',
                label: t('tabs.candidates'),
                description: t('cmd.goToCandidates'),
                onClick: () => navigate(ROUTES.candidates),
                leftSection: <IconSparkles size={18} />,
                keywords: ['candidates', 'vorschlaege', 'matches'],
            },
            {
                id: 'nav-agents',
                label: t('nav.agents'),
                description: t('cmd.goToAgents'),
                onClick: () => navigate(ROUTES.agents),
                leftSection: <IconRobot size={18} />,
                keywords: ['agents', 'agenten', 'search'],
            },
            {
                id: 'new-entry',
                label: t('toolbar.newEntry'),
                description: t('cmd.createEntry') + ' (Cmd+N)',
                onClick: onNewEntry,
                leftSection: <IconPlus size={18} />,
                keywords: ['new', 'neu', 'add', 'entry'],
            },
            {
                id: 'quick-add',
                label: t('toolbar.quickAdd'),
                description: t('cmd.quickAddDesc') + ' (Cmd+Shift+N)',
                onClick: onQuickAdd,
                leftSection: <IconPlayerPlay size={18} />,
                keywords: ['quick', 'url', 'clipboard', 'paste'],
            },
            {
                id: 'export',
                label: t('toolbar.export'),
                description: t('cmd.exportDesc') + ' (Cmd+E)',
                onClick: onExport,
                leftSection: <IconDownload size={18} />,
                keywords: ['export', 'excel', 'xlsx'],
            },
            {
                id: 'settings',
                label: t('toolbar.settings'),
                description: t('cmd.settingsDesc') + ' (Cmd+,)',
                onClick: () => navigate(ROUTES.settings),
                leftSection: <IconSettings size={18} />,
                keywords: ['settings', 'einstellungen', 'config'],
            },
        ],
        [t, navigate, onNewEntry, onExport, onQuickAdd],
    );

    return (
        <Spotlight
            actions={actions}
            shortcut={['mod + K', 'mod + k']}
            searchProps={{
                leftSection: <IconSearch size={18} />,
                placeholder: t('cmd.placeholder'),
            }}
            nothingFound={t('cmd.nothingFound')}
            highlightQuery
        />
    );
}
