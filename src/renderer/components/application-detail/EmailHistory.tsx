import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { SentEmailRecord } from '../../../preload/index';
import { formatDateShort, formatEventTime, stripHtmlSnippet } from '../../lib/format';
import { Label } from '../primitives/Label';

interface Props {
    emails: SentEmailRecord[];
}

/** Section that lists all emails sent for this application. Rows expand. */
export function EmailHistory({ emails }: Props) {
    const { t } = useTranslation();
    const [expandedId, setExpandedId] = useState<string | null>(null);

    if (emails.length === 0) return null;

    return (
        <div style={{ marginTop: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <Label>
                    {t('detail.emails.label', 'Versendet')} · {emails.length}
                </Label>
                <div style={{ flex: 1, height: 1, background: 'var(--rule)' }} />
            </div>
            <div style={{ border: '1px solid var(--rule)', background: 'var(--card)' }}>
                {emails.map((email, i) => (
                    <EmailRow
                        key={email.id}
                        email={email}
                        isLast={i === emails.length - 1}
                        expanded={expandedId === email.id}
                        onToggle={() =>
                            setExpandedId((prev) => (prev === email.id ? null : email.id))
                        }
                    />
                ))}
            </div>
        </div>
    );
}

interface RowProps {
    email: SentEmailRecord;
    isLast: boolean;
    expanded: boolean;
    onToggle: () => void;
}

function EmailRow({ email, isLast, expanded, onToggle }: RowProps) {
    const stamp = `${formatDateShort(email.sentAt)} · ${formatEventTime(email.sentAt)}`;
    const failed = email.status !== 'ok';

    return (
        <div style={{ borderBottom: isLast ? 'none' : '1px solid var(--rule)' }}>
            <button
                type="button"
                onClick={onToggle}
                style={{
                    display: 'grid',
                    gridTemplateColumns: '10px 130px 1fr 16px',
                    columnGap: 12,
                    alignItems: 'center',
                    width: '100%',
                    padding: '10px 12px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    font: 'inherit',
                }}
            >
                <div
                    style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: failed ? 'var(--rust)' : 'var(--moss)',
                    }}
                />
                <span
                    className="mono"
                    style={{
                        fontSize: 10.5,
                        color: 'var(--ink-3)',
                        letterSpacing: '0.04em',
                    }}
                >
                    {stamp}
                </span>
                <div style={{ minWidth: 0 }}>
                    <div
                        style={{
                            fontSize: 13,
                            color: 'var(--ink)',
                            fontWeight: 500,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {email.subject || '—'}
                    </div>
                    <div
                        style={{
                            fontSize: 11,
                            color: 'var(--ink-3)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            marginTop: 2,
                        }}
                    >
                        {email.toAddress} · {stripHtmlSnippet(email.body, 80)}
                    </div>
                </div>
                <span
                    style={{
                        color: 'var(--ink-4)',
                        fontSize: 11,
                        transform: expanded ? 'rotate(90deg)' : 'none',
                        transition: 'transform 120ms',
                    }}
                >
                    ›
                </span>
            </button>
            {expanded && <ExpandedBody email={email} />}
        </div>
    );
}

function ExpandedBody({ email }: { email: SentEmailRecord }) {
    return (
        <div
            style={{
                padding: '12px 20px 18px',
                borderTop: '1px dashed var(--rule)',
                background: 'var(--paper)',
            }}
        >
            <div
                style={{
                    fontSize: 11,
                    color: 'var(--ink-4)',
                    marginBottom: 8,
                    fontFamily: 'var(--f-mono)',
                    letterSpacing: '0.04em',
                }}
            >
                {new Date(email.sentAt).toLocaleString()}
            </div>
            <div
                style={{
                    fontSize: 13.5,
                    color: 'var(--ink)',
                    lineHeight: 1.55,
                }}
                dangerouslySetInnerHTML={{ __html: email.body }}
            />
        </div>
    );
}
