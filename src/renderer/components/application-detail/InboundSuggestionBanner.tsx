import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import type { InboundEmailDto } from '../../../preload/index';
import type { ApplicationStatus } from '@shared/application';
import { GhostBtn } from '../primitives/GhostBtn';

interface Props {
    inbounds: InboundEmailDto[];
    applicationId: string;
    onChanged: () => void | Promise<void>;
}

/** Yellow banner stack for pending inbound mails with a usable status suggestion. */
export function InboundSuggestionBanner({ inbounds, applicationId, onChanged }: Props) {
    const pending = inbounds.filter(
        (m) =>
            m.reviewStatus === 'pending' &&
            m.suggestedStatus !== null &&
            m.suggestedStatus !== 'other' &&
            m.suggestedApplicationId === applicationId,
    );

    if (pending.length === 0) return null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 22px 0' }}>
            {pending.map((m) => (
                <BannerRow
                    key={m.id}
                    mail={m}
                    applicationId={applicationId}
                    onChanged={onChanged}
                />
            ))}
        </div>
    );
}

interface RowProps {
    mail: InboundEmailDto;
    applicationId: string;
    onChanged: () => void | Promise<void>;
}

function BannerRow({ mail, applicationId, onChanged }: RowProps) {
    const { t } = useTranslation();
    const status = mail.suggestedStatus as ApplicationStatus;

    const apply = async () => {
        const res = await window.api.inbox.applySuggestion({
            inboundId: mail.id,
            applicationId,
            status,
            note: mail.suggestedNote,
        });
        if (!res.ok) {
            notifications.show({
                color: 'red',
                title: t('inbox.applyFailed', 'Übernahme fehlgeschlagen'),
                message: res.error ?? '',
            });
            return;
        }
        await onChanged();
    };

    const dismiss = async () => {
        await window.api.inbox.dismiss(mail.id);
        await onChanged();
    };

    return (
        <div
            style={{
                border: '1px solid var(--accent)',
                background: 'color-mix(in srgb, var(--accent) 10%, var(--paper))',
                padding: '10px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
            }}
        >
            <div
                style={{
                    fontSize: 11,
                    fontFamily: 'var(--f-mono)',
                    color: 'var(--ink-3)',
                    letterSpacing: '0.04em',
                }}
            >
                {t('inbox.suggestionBannerLabel', 'Neue Antwort')} ·{' '}
                {t(`status.${status}`, status)} · {mail.confidence}%
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 500 }}>
                {mail.subject || '—'}
            </div>
            {mail.suggestedNote && (
                <div
                    style={{
                        fontSize: 12,
                        color: 'var(--ink-2)',
                        lineHeight: 1.4,
                    }}
                >
                    {mail.suggestedNote}
                </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <GhostBtn onClick={apply}>
                    {t('inbox.applySuggestion', 'Übernehmen')}
                </GhostBtn>
                <GhostBtn onClick={dismiss}>{t('inbox.dismiss', 'Verwerfen')}</GhostBtn>
            </div>
        </div>
    );
}
