import type { ApplicationStatus } from '@shared/application';
import { StageGlyph } from '../primitives/StageGlyph';
import { PROGRESS_STAGES, STAGE_SHORT_LABEL } from './constants';
import { stageIndex } from './utils';

interface Props {
    status: ApplicationStatus;
}

/**
 * 5-step progress bar (Draft → Applied → Review → Interview → Offer).
 * Terminal states (rejected / withdrawn) render a single closed banner.
 */
export function StageProgress({ status }: Props) {
    if (status === 'rejected' || status === 'withdrawn') {
        return <ClosedBanner status={status} />;
    }

    const idx = stageIndex(status);

    return (
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 2, width: '100%' }}>
            {PROGRESS_STAGES.map((s, i) => {
                const done = i < idx;
                const active = i === idx;
                return (
                    <div
                        key={s}
                        style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}
                    >
                        <div
                            style={{
                                height: 4,
                                background: done
                                    ? 'var(--ink-2)'
                                    : active
                                      ? 'var(--accent)'
                                      : 'var(--paper-3)',
                            }}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <StageGlyph status={s} size={9} />
                            <span
                                className="mono"
                                style={{
                                    fontSize: 9.5,
                                    fontWeight: active ? 700 : 500,
                                    color: active
                                        ? 'var(--ink)'
                                        : done
                                          ? 'var(--ink-3)'
                                          : 'var(--ink-4)',
                                    letterSpacing: '0.08em',
                                    textTransform: 'uppercase',
                                }}
                            >
                                {STAGE_SHORT_LABEL[s]}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function ClosedBanner({ status }: { status: ApplicationStatus }) {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                background: 'var(--paper-2)',
                border: '1px solid var(--rule)',
            }}
        >
            <StageGlyph status={status} size={12} />
            <span
                className="mono"
                style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--ink-2)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                }}
            >
                {STAGE_SHORT_LABEL[status]}
            </span>
        </div>
    );
}
