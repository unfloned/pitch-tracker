import { useTranslation } from 'react-i18next';
import type { ApplicationRecord } from '../../../preload/index';
import { GhostBtn } from '../primitives/GhostBtn';
import { Kbd } from '../primitives/Kbd';
import { Label } from '../primitives/Label';
import { MatchScore } from '../primitives/MatchScore';
import { StageGlyph } from '../primitives/StageGlyph';
import type { ApplicationForm } from './types';

interface Props {
    initial: ApplicationRecord | null;
    form: ApplicationForm;
    onClose: () => void;
}

/** Sticky top of the form drawer — same shape as ApplicationDetail's header. */
export function FormHeader({ initial, form, onClose }: Props) {
    const { t } = useTranslation();
    return (
        <div
            style={{
                padding: '18px 22px 14px',
                borderBottom: '1px solid var(--rule)',
                background: 'var(--paper)',
                flexShrink: 0,
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                {initial ? (
                    <>
                        <span
                            className="mono"
                            style={{
                                fontSize: 10.5,
                                color: 'var(--ink-3)',
                                letterSpacing: '0.08em',
                            }}
                        >
                            {initial.id.slice(0, 8).toUpperCase()}
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
                            {initial.source || 'direct'}
                        </span>
                    </>
                ) : (
                    <Label>{t('form.newLabel', 'New application')}</Label>
                )}
                <div style={{ flex: 1 }} />
                {form.values.matchScore > 0 && (
                    <MatchScore value={form.values.matchScore} width={48} />
                )}
                <GhostBtn onClick={onClose}>
                    <span>{t('common.close', 'Close')}</span>
                    <Kbd>esc</Kbd>
                </GhostBtn>
            </div>

            <div
                className="serif"
                style={{
                    fontSize: 26,
                    fontWeight: 500,
                    color: 'var(--ink)',
                    letterSpacing: '-0.015em',
                    lineHeight: 1.15,
                }}
            >
                {form.values.jobTitle || t('form.newTitle')}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <StageGlyph status={form.values.status} size={11} />
                <span style={{ fontSize: 14, color: 'var(--ink-2)', fontWeight: 500 }}>
                    {form.values.companyName || t('form.company')}
                </span>
                {form.values.location && (
                    <>
                        <span style={{ color: 'var(--ink-4)' }}>·</span>
                        <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>
                            {form.values.location}
                        </span>
                    </>
                )}
            </div>
        </div>
    );
}
