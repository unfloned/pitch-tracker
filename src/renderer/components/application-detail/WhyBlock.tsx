import { useTranslation } from 'react-i18next';
import type { ApplicationRecord } from '../../../preload/index';
import { Label } from '../primitives/Label';

interface Props {
    app: ApplicationRecord;
}

/**
 * Accent blockquote that either shows the LLM match reason or, absent that,
 * falls back to the first paragraph of the job description as a quieter
 * excerpt (no accent, rule-strong border).
 */
export function WhyBlock({ app }: Props) {
    const { t } = useTranslation();
    const hasExcerpt = (app.jobDescription || '').trim().length > 0;

    if (app.matchReason) {
        return (
            <div style={{ marginTop: 22, paddingLeft: 16, borderLeft: '3px solid var(--accent)' }}>
                <Label>{t('detail.why.label', 'Why this one')}</Label>
                <p
                    className="serif"
                    style={{
                        fontSize: 15,
                        fontStyle: 'italic',
                        color: 'var(--ink-2)',
                        marginTop: 6,
                        lineHeight: 1.4,
                        marginBottom: 4,
                    }}
                >
                    {app.matchReason}
                </p>
                <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)' }}>
                    {t('detail.why.source', '— local fit score')}
                </span>
            </div>
        );
    }

    if (hasExcerpt) {
        return (
            <div
                style={{
                    marginTop: 22,
                    paddingLeft: 16,
                    borderLeft: '3px solid var(--rule-strong)',
                }}
            >
                <Label>{t('detail.excerpt.label', 'From the posting')}</Label>
                <p
                    className="serif"
                    style={{
                        fontSize: 14,
                        color: 'var(--ink-2)',
                        marginTop: 6,
                        lineHeight: 1.45,
                        marginBottom: 0,
                        display: '-webkit-box',
                        WebkitLineClamp: 4,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                    }}
                >
                    {app.jobDescription}
                </p>
            </div>
        );
    }

    return null;
}
