import { useTranslation } from 'react-i18next';
import { Label } from '../primitives/Label';

interface Props {
    notes: string;
}

/**
 * Rich-text notes rendered on a paper-lines background. Notes are stored as
 * HTML from Tiptap; sanitization happens at input time in the form drawer.
 */
export function NotesBlock({ notes }: Props) {
    const { t } = useTranslation();

    if (!notes || !notes.trim()) return null;

    return (
        <div style={{ marginTop: 24 }}>
            <Label>{t('detail.notes.label', 'Notes')}</Label>
            <div
                style={{
                    marginTop: 8,
                    padding: 14,
                    background: 'var(--card)',
                    border: '1px solid var(--rule)',
                    backgroundImage:
                        'repeating-linear-gradient(0deg, transparent 0, transparent 23px, rgba(0,0,0,0.04) 23px, rgba(0,0,0,0.04) 24px)',
                    backgroundPosition: '0 6px',
                    fontFamily: 'var(--f-display)',
                    fontSize: 14,
                    lineHeight: '24px',
                    color: 'var(--ink)',
                }}
                dangerouslySetInnerHTML={{ __html: notes }}
            />
        </div>
    );
}
