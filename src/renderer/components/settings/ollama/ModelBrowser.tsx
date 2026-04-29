import { useTranslation } from 'react-i18next';
import { Label } from '../../primitives/Label';
import { groupModels } from './catalog';
import { ModelRow } from './ModelRow';
import type { UseOllama } from './useOllama';

interface Props {
    ollama: UseOllama;
}

/**
 * Family-grouped model list. Each row delegates display + actions to
 * ModelRow; this component only handles the grouping wrapper.
 */
export function ModelBrowser({ ollama }: Props) {
    const { t } = useTranslation();
    const groups = groupModels(
        ollama.installed,
        t('settings.customModel', 'Manuell installiert'),
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {groups.map(({ family, items }) => (
                <div key={family}>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            marginBottom: 6,
                        }}
                    >
                        <Label>{family}</Label>
                        <div style={{ flex: 1, height: 1, background: 'var(--rule)' }} />
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            border: '1px solid var(--rule)',
                            background: 'var(--card)',
                        }}
                    >
                        {items.map((m, i) => (
                            <ModelRow
                                key={m.name}
                                model={m}
                                isFirst={i === 0}
                                installed={ollama.installed.has(m.name)}
                                isActive={ollama.activeModel === m.name}
                                progress={ollama.progress[m.name]}
                                canPull={ollama.status?.running ?? false}
                                onUse={() => ollama.setActive(m.name)}
                                onPull={() => ollama.pull(m.name)}
                                onCancel={() => ollama.cancel(m.name)}
                                onRemove={() => ollama.remindRemove(m.name)}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
