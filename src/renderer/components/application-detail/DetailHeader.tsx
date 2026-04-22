import { useTranslation } from 'react-i18next';
import type { ApplicationRecord } from '../../../preload/index';
import { initialsFor } from '../../lib/format';
import { GhostBtn } from '../primitives/GhostBtn';
import { Kbd } from '../primitives/Kbd';
import { NextStepCallout } from './NextStepCallout';
import { StageProgress } from './StageProgress';
import { remoteLabel } from './utils';

interface Props {
    app: ApplicationRecord;
    onEdit: (app: ApplicationRecord) => void;
    onClose: () => void;
}

/**
 * Top section of the detail pane: ID + source row, title, company + remote /
 * location line, the stage progress bar, and the next-step callout when the
 * status warrants it.
 */
export function DetailHeader({ app, onEdit, onClose }: Props) {
    const { t } = useTranslation();
    const idShort = (app.id?.slice(0, 8) || '').toUpperCase();
    const initials = initialsFor(app.companyName || app.jobTitle || 'X');

    return (
        <div
            style={{
                padding: '18px 22px 14px',
                borderBottom: '1px solid var(--rule)',
                flexShrink: 0,
            }}
        >
            {/* meta row */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 10,
                }}
            >
                <span
                    className="mono"
                    style={{
                        fontSize: 10.5,
                        color: 'var(--ink-3)',
                        letterSpacing: '0.08em',
                    }}
                >
                    {idShort || '—'}
                </span>
                <div style={{ width: 1, height: 10, background: 'var(--rule-strong)' }} />
                <span
                    className="mono"
                    style={{
                        fontSize: 10,
                        color: 'var(--ink-4)',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                    }}
                >
                    {app.source || 'direct'}
                </span>
                <div style={{ flex: 1 }} />
                <GhostBtn onClick={() => onEdit(app)}>
                    <span>{t('common.edit', 'Edit')}</span>
                    <Kbd>⌘.</Kbd>
                </GhostBtn>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label={t('common.close', 'Close')}
                    style={{
                        width: 22,
                        height: 22,
                        border: '1px solid var(--rule)',
                        background: 'var(--card)',
                        fontSize: 11,
                        color: 'var(--ink-3)',
                        cursor: 'pointer',
                        borderRadius: 3,
                    }}
                >
                    ✕
                </button>
            </div>

            {/* title */}
            <div
                className="serif"
                style={{
                    fontSize: 26,
                    fontWeight: 500,
                    color: 'var(--ink)',
                    letterSpacing: '-0.015em',
                    lineHeight: 1.1,
                }}
            >
                {app.jobTitle || t('applications.table.noTitle', 'Untitled role')}
            </div>

            {/* company + remote / location */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <div
                    style={{
                        width: 20,
                        height: 20,
                        background: 'var(--card)',
                        border: '1px solid var(--rule-strong)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <span className="mono" style={{ fontSize: 9, fontWeight: 600 }}>
                        {initials}
                    </span>
                </div>
                <span style={{ fontSize: 14, color: 'var(--ink-2)', fontWeight: 500 }}>
                    {app.companyName || t('applications.table.noCompany', '—')}
                </span>
                {app.remote && (
                    <>
                        <span style={{ color: 'var(--ink-4)' }}>·</span>
                        <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>
                            {remoteLabel(app.remote, t)}
                            {app.location ? ` · ${app.location}` : ''}
                        </span>
                    </>
                )}
            </div>

            <div style={{ marginTop: 18 }}>
                <StageProgress status={app.status} />
            </div>

            <NextStepCallout status={app.status} />
        </div>
    );
}
