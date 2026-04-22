import { useTranslation } from 'react-i18next';
import type { ApplicationStatus } from '@shared/application';
import { Kbd } from '../primitives/Kbd';
import { Label } from '../primitives/Label';

interface Props {
    status: ApplicationStatus;
}

/**
 * Prominent accent-colored block inside the header, only shown for statuses
 * that actually need attention (draft = finish & submit, offer = decide).
 * Returns null for other statuses so the header collapses cleanly.
 */
export function NextStepCallout({ status }: Props) {
    const { t } = useTranslation();

    if (status !== 'offer_received' && status !== 'draft') return null;

    const text =
        status === 'offer_received'
            ? t('detail.next.offer', 'Review offer and respond')
            : t('detail.next.draft', 'Finish draft and submit');
    const kbd = status === 'offer_received' ? '⇧⌘A' : '⌘L';

    return (
        <div
            style={{
                marginTop: 16,
                padding: '10px 12px',
                background: 'var(--accent)',
                color: 'var(--ink)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
            }}
        >
            <span style={{ fontSize: 14 }}>◆</span>
            <div style={{ flex: 1 }}>
                <Label color="var(--accent-ink)">{t('detail.next.label', 'Next')}</Label>
                <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 1 }}>{text}</div>
            </div>
            <Kbd tone="dark">{kbd}</Kbd>
        </div>
    );
}
