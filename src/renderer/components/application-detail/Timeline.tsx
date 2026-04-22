import { useTranslation } from 'react-i18next';
import type { ApplicationEvent } from '../../../preload/index';
import { STATUS_LABEL } from '@shared/application';
import { formatDateShort, formatEventTime } from '../../lib/format';
import { Label } from '../primitives/Label';

interface Props {
    events: ApplicationEvent[];
    createdAt: string;
}

/**
 * Status-change timeline rendered newest-first. A vertical rule connects
 * the dots, the newest event gets the accent diamond, older events get
 * plain ring dots.
 */
export function Timeline({ events, createdAt }: Props) {
    const { t } = useTranslation();

    const rows =
        events.length > 0
            ? [...events].sort(
                  (a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime(),
              )
            : [];

    return (
        <div style={{ marginTop: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <Label>{t('detail.timeline.label', 'Timeline')}</Label>
                <div style={{ flex: 1, height: 1, background: 'var(--rule)' }} />
            </div>
            {rows.length === 0 ? (
                <CreatedRow createdAt={createdAt} label={t('detail.timeline.created', 'Created')} />
            ) : (
                <EventList events={rows} t={t} />
            )}
        </div>
    );
}

function CreatedRow({ createdAt, label }: { createdAt: string; label: string }) {
    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: '64px 16px 1fr',
                gap: 8,
                padding: '10px 0',
                alignItems: 'flex-start',
            }}
        >
            <DateCell iso={createdAt} />
            <DotCell variant="ring" />
            <TextCell>{label}</TextCell>
        </div>
    );
}

function EventList({
    events,
    t,
}: {
    events: ApplicationEvent[];
    t: (key: string, options?: Record<string, unknown>) => string;
}) {
    return (
        <div style={{ position: 'relative' }}>
            <div
                style={{
                    position: 'absolute',
                    left: 68,
                    top: 0,
                    bottom: 0,
                    width: 1,
                    background: 'var(--rule)',
                }}
            />
            {events.map((e, i) => {
                const isLatest = i === 0;
                const text = e.fromStatus
                    ? t('detail.timeline.transition', {
                          from: STATUS_LABEL[e.fromStatus],
                          to: STATUS_LABEL[e.toStatus],
                          defaultValue: `${STATUS_LABEL[e.fromStatus]} → ${STATUS_LABEL[e.toStatus]}`,
                      })
                    : STATUS_LABEL[e.toStatus];
                return (
                    <div
                        key={e.id}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '64px 16px 1fr',
                            gap: 8,
                            padding: '10px 0',
                            alignItems: 'flex-start',
                            position: 'relative',
                        }}
                    >
                        <DateCell iso={e.changedAt} highlight={isLatest} />
                        <DotCell variant={isLatest ? 'diamond' : 'ring'} />
                        <TextCell highlight={isLatest}>{text}</TextCell>
                    </div>
                );
            })}
        </div>
    );
}

function DateCell({ iso, highlight = false }: { iso: string; highlight?: boolean }) {
    return (
        <div
            className="mono"
            style={{
                fontSize: 10,
                color: 'var(--ink-3)',
                lineHeight: 1.3,
                textAlign: 'right',
                paddingRight: 4,
            }}
        >
            <div
                style={{
                    color: highlight ? 'var(--accent-ink)' : 'var(--ink-2)',
                    fontWeight: 600,
                }}
            >
                {formatDateShort(iso)}
            </div>
            <div style={{ fontSize: 9, marginTop: 1 }}>{formatEventTime(iso)}</div>
        </div>
    );
}

function DotCell({ variant }: { variant: 'ring' | 'diamond' }) {
    const isDiamond = variant === 'diamond';
    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'center',
                paddingTop: 4,
                position: 'relative',
                zIndex: 1,
            }}
        >
            <div
                style={{
                    width: 9,
                    height: 9,
                    borderRadius: isDiamond ? 0 : '50%',
                    background: isDiamond ? 'var(--accent)' : 'var(--card)',
                    border: '1.5px solid ' + (isDiamond ? 'var(--accent)' : 'var(--ink-3)'),
                    transform: isDiamond ? 'rotate(45deg)' : 'none',
                }}
            />
        </div>
    );
}

function TextCell({
    children,
    highlight = false,
}: {
    children: React.ReactNode;
    highlight?: boolean;
}) {
    return (
        <div
            style={{
                fontSize: 12.5,
                color: highlight ? 'var(--ink)' : 'var(--ink-2)',
                fontWeight: highlight ? 600 : 400,
                lineHeight: 1.4,
                paddingBottom: 2,
            }}
        >
            {children}
        </div>
    );
}
