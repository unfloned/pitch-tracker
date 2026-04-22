import { useTranslation } from 'react-i18next';
import { ApplicationStatus } from '@shared/application';
import { StageGlyph } from './primitives/StageGlyph';

/**
 * Status label with a geometric StageGlyph. Replaces colored Badge pills.
 * Keeping the old component name so call sites don't need to change.
 */
export function StatusBadge({ status }: { status: ApplicationStatus }) {
    const { t } = useTranslation();
    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '1px 6px',
                borderRadius: 2,
                border: '1px solid var(--rule)',
                background: 'var(--paper-2)',
                fontSize: 11,
                fontWeight: 500,
                color: 'var(--ink-2)',
                lineHeight: '18px',
            }}
        >
            <StageGlyph status={status} size={9} />
            {t(`status.${status}`)}
        </span>
    );
}
