import { useTranslation } from 'react-i18next';

interface Props {
    fromAddress: string;
    fromName: string;
    to: string;
    subject: string;
    body: string;
    attachCv: boolean;
}

/**
 * Read-only render of the outgoing email - shows envelope (From/To/Subject/
 * Attachment hint) and the HTML body as the recipient's client would render it.
 */
export function EmailPreview({
    fromAddress,
    fromName,
    to,
    subject,
    body,
    attachCv,
}: Props) {
    const { t } = useTranslation();
    return (
        <div style={{ border: '1px solid var(--rule-strong)', background: 'var(--card)' }}>
            <div
                style={{
                    padding: '14px 18px',
                    borderBottom: '1px solid var(--rule)',
                    background: 'var(--paper-2)',
                    display: 'grid',
                    gridTemplateColumns: '70px 1fr',
                    columnGap: 12,
                    rowGap: 6,
                    fontSize: 12,
                }}
            >
                <Meta label="FROM" />
                <span style={{ color: 'var(--ink-2)' }}>
                    {fromName ? `${fromName} <${fromAddress}>` : fromAddress || '—'}
                </span>
                <Meta label="TO" />
                <span style={{ color: 'var(--ink-2)' }}>{to || '—'}</span>
                <Meta label="SUBJECT" />
                <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{subject || '—'}</span>
                {attachCv && (
                    <>
                        <Meta label="ATTACH" />
                        <span className="mono" style={{ color: 'var(--ink-3)', fontSize: 11 }}>
                            {t('email.attachCv')} (CV)
                        </span>
                    </>
                )}
            </div>
            <div
                style={{
                    padding: '18px 22px',
                    fontFamily: 'var(--f-ui)',
                    fontSize: 14,
                    lineHeight: 1.55,
                    color: 'var(--ink)',
                    minHeight: 200,
                }}
                dangerouslySetInnerHTML={{ __html: body || '<p>—</p>' }}
            />
        </div>
    );
}

function Meta({ label }: { label: string }) {
    return (
        <span
            className="mono"
            style={{ color: 'var(--ink-4)', fontSize: 10, letterSpacing: '0.1em' }}
        >
            {label}
        </span>
    );
}
