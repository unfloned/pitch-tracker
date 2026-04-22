import { useTranslation } from 'react-i18next';
import { Label } from '../primitives/Label';
import { SUGGESTIONS_KEYS } from './constants';

interface Props {
    onPick: (prompt: string) => void;
}

/** Empty-state quick-starter prompts shown before the user has typed anything. */
export function Suggestions({ onPick }: Props) {
    const { t } = useTranslation();
    return (
        <div style={{ marginBottom: 28 }}>
            <Label>Suggestions</Label>
            <div
                style={{
                    marginTop: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                }}
            >
                {SUGGESTIONS_KEYS.map((key) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => onPick(t(key))}
                        style={{
                            textAlign: 'left',
                            padding: '10px 12px',
                            border: '1px solid var(--rule)',
                            background: 'var(--card)',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontSize: 13.5,
                            color: 'var(--ink-2)',
                            fontFamily: 'var(--f-ui)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--paper-2)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'var(--card)';
                        }}
                    >
                        <span style={{ color: 'var(--ink-4)' }}>↪</span>
                        {t(key)}
                    </button>
                ))}
            </div>
        </div>
    );
}
