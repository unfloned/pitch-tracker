import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { InboundEmailDto, SentEmailRecord } from '../../../preload/index';
import { formatDateShort, formatEventTime, stripHtmlSnippet } from '../../lib/format';
import { Label } from '../primitives/Label';

interface Props {
    emails: SentEmailRecord[];
    inbounds: InboundEmailDto[];
}

type Item =
    | { kind: 'sent'; data: SentEmailRecord; ts: string }
    | { kind: 'inbound'; data: InboundEmailDto; ts: string };

function rowKey(item: Item): string {
    return item.kind === 'sent' ? `s-${item.data.id}` : `i-${item.data.id}`;
}

/** Combined sent + inbound mail history for one application. */
export function EmailHistory({ emails, inbounds }: Props) {
    const { t } = useTranslation();
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const items: Item[] = [
        ...emails.map((e): Item => ({ kind: 'sent', data: e, ts: e.sentAt })),
        ...inbounds.map((e): Item => ({ kind: 'inbound', data: e, ts: e.receivedAt })),
    ].sort((a, b) => b.ts.localeCompare(a.ts));

    if (items.length === 0) return null;

    return (
        <div style={{ marginTop: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <Label>
                    {t('detail.emails.label', 'Mail-Verlauf')} · {items.length}
                </Label>
                <div style={{ flex: 1, height: 1, background: 'var(--rule)' }} />
            </div>
            <div style={{ border: '1px solid var(--rule)', background: 'var(--card)' }}>
                {items.map((item, i) => {
                    const key = rowKey(item);
                    return (
                        <Row
                            key={key}
                            item={item}
                            isLast={i === items.length - 1}
                            expanded={expandedId === key}
                            onToggle={() =>
                                setExpandedId((prev) => (prev === key ? null : key))
                            }
                        />
                    );
                })}
            </div>
        </div>
    );
}

interface RowProps {
    item: Item;
    isLast: boolean;
    expanded: boolean;
    onToggle: () => void;
}

function Row({ item, isLast, expanded, onToggle }: RowProps) {
    const isInbound = item.kind === 'inbound';
    const stamp = `${formatDateShort(item.ts)} · ${formatEventTime(item.ts)}`;

    let dotColor: string;
    let direction: string;
    let title: string;
    let secondary: string;

    if (item.kind === 'sent') {
        const failed = item.data.status !== 'ok';
        dotColor = failed ? 'var(--rust)' : 'var(--moss)';
        direction = '→';
        title = item.data.subject || '—';
        secondary = `${item.data.toAddress} · ${stripHtmlSnippet(item.data.body, 80)}`;
    } else {
        dotColor = 'var(--ink-2)';
        direction = '←';
        title = item.data.subject || '—';
        const sender = item.data.fromName
            ? `${item.data.fromName} <${item.data.fromAddress}>`
            : item.data.fromAddress;
        const snippet = item.data.bodyText.replace(/\s+/g, ' ').slice(0, 80);
        secondary = `${sender} · ${snippet}`;
    }

    return (
        <div style={{ borderBottom: isLast ? 'none' : '1px solid var(--rule)' }}>
            <button
                type="button"
                onClick={onToggle}
                style={{
                    display: 'grid',
                    gridTemplateColumns: '10px 14px 130px 1fr 16px',
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
                        background: dotColor,
                    }}
                />
                <span
                    style={{
                        fontSize: 12,
                        color: 'var(--ink-3)',
                        fontFamily: 'var(--f-mono)',
                    }}
                >
                    {direction}
                </span>
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
                        {title}
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
                        {secondary}
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
            {expanded && (isInbound ? <InboundBody item={item.data} /> : <SentBody email={item.data} />)}
        </div>
    );
}

function SentBody({ email }: { email: SentEmailRecord }) {
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

function InboundBody({ item }: { item: InboundEmailDto }) {
    const { t } = useTranslation();
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
                {new Date(item.receivedAt).toLocaleString()} · {item.fromAddress}
            </div>
            {item.suggestedStatus && item.reviewStatus === 'applied' && (
                <div
                    style={{
                        fontSize: 11,
                        color: 'var(--ink-3)',
                        marginBottom: 10,
                        fontFamily: 'var(--f-mono)',
                    }}
                >
                    auto-applied · {t(`status.${item.suggestedStatus}`, item.suggestedStatus)} · {item.confidence}%
                </div>
            )}
            <div
                style={{
                    fontSize: 13.5,
                    color: 'var(--ink)',
                    lineHeight: 1.55,
                    whiteSpace: 'pre-wrap',
                }}
            >
                {item.bodyText}
            </div>
        </div>
    );
}
