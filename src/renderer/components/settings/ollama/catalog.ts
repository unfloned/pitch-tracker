export interface RecommendedModel {
    name: string;
    family: string;
    note: string;
}

/**
 * Hand-curated catalog. Ollama has no public discovery API, so we maintain
 * this list manually. Users can still pull any name via the custom-pull
 * field at the bottom of the browser. Order within a family is roughly by
 * size, smallest first.
 */
export const RECOMMENDED_MODELS: RecommendedModel[] = [
    { name: 'llama3.2:1b', family: 'Llama', note: '1B · 1.3 GB · winzig und schnell' },
    { name: 'llama3.2:3b', family: 'Llama', note: '3B · 2.0 GB · default für schnelles Scoring' },
    { name: 'llama3.1:8b', family: 'Llama', note: '8B · 4.7 GB · deutlich stärker bei JSON' },
    { name: 'llama3.3:70b', family: 'Llama', note: '70B · 43 GB · Top-Qualität, viel RAM nötig' },

    { name: 'qwen2.5:1.5b', family: 'Qwen', note: '1.5B · 986 MB · klein aber brauchbar' },
    { name: 'qwen2.5:3b', family: 'Qwen', note: '3B · 1.9 GB · guter Kompromiss' },
    { name: 'qwen2.5:7b', family: 'Qwen', note: '7B · 4.4 GB · sehr gut für JSON-Scoring' },
    { name: 'qwen2.5:14b', family: 'Qwen', note: '14B · 9.0 GB · hohe Qualität' },
    { name: 'qwen2.5:32b', family: 'Qwen', note: '32B · 20 GB · sehr hohe Qualität, langsam' },
    { name: 'qwen2.5-coder:7b', family: 'Qwen', note: '7B Code · 4.7 GB' },
    { name: 'qwen2.5-coder:14b', family: 'Qwen', note: '14B Code · 9.0 GB' },

    { name: 'gemma2:2b', family: 'Gemma', note: '2B · 1.6 GB · sehr klein' },
    { name: 'gemma2:9b', family: 'Gemma', note: '9B · 5.4 GB · solider Allrounder' },
    { name: 'gemma2:27b', family: 'Gemma', note: '27B · 16 GB · höchste Qualität der Familie' },
    { name: 'gemma3:4b', family: 'Gemma', note: '4B · neuere Generation' },
    { name: 'gemma3:12b', family: 'Gemma', note: '12B · neuere Generation' },

    { name: 'mistral:7b', family: 'Mistral', note: '7B · 4.1 GB · schnell und solide' },
    { name: 'mistral-nemo:12b', family: 'Mistral', note: '12B · 7.1 GB · längerer Kontext' },
    { name: 'mistral-small:22b', family: 'Mistral', note: '22B · 13 GB · hohe Qualität' },

    { name: 'phi3:mini', family: 'Phi', note: '3.8B · 2.3 GB · sehr klein' },
    { name: 'phi3.5:3.8b', family: 'Phi', note: '3.8B · aktuellere Version von phi3:mini' },
    { name: 'phi4:14b', family: 'Phi', note: '14B · 9.1 GB · neueste Generation' },

    { name: 'deepseek-r1:1.5b', family: 'DeepSeek R1', note: '1.5B · reasoning · winzig' },
    { name: 'deepseek-r1:7b', family: 'DeepSeek R1', note: '7B · reasoning · 4.7 GB' },
    { name: 'deepseek-r1:8b', family: 'DeepSeek R1', note: '8B · reasoning · basiert auf Llama' },
    { name: 'deepseek-r1:14b', family: 'DeepSeek R1', note: '14B · reasoning · 9.0 GB' },
    { name: 'deepseek-r1:32b', family: 'DeepSeek R1', note: '32B · reasoning · 20 GB' },
];

/** Display order. Anything not listed sinks to the bottom under "Andere". */
export const FAMILY_ORDER = ['Llama', 'Qwen', 'Gemma', 'Mistral', 'Phi', 'DeepSeek R1'];

export const OTHER_FAMILY = 'Andere';

/** Group catalog + installed-but-uncatalogued models for the browser UI. */
export function groupModels(
    installed: Set<string>,
    fallbackNote: string,
): Array<{ family: string; items: RecommendedModel[] }> {
    const map = new Map<string, RecommendedModel[]>();
    for (const m of RECOMMENDED_MODELS) {
        const arr = map.get(m.family) ?? [];
        arr.push(m);
        map.set(m.family, arr);
    }

    const knownNames = new Set(RECOMMENDED_MODELS.map((m) => m.name));
    const extras: RecommendedModel[] = [];
    for (const name of installed) {
        if (!knownNames.has(name)) {
            extras.push({ name, family: OTHER_FAMILY, note: fallbackNote });
        }
    }
    if (extras.length > 0) map.set(OTHER_FAMILY, extras);

    const ordered: Array<{ family: string; items: RecommendedModel[] }> = [];
    for (const fam of FAMILY_ORDER) {
        const items = map.get(fam);
        if (items) ordered.push({ family: fam, items });
    }
    const others = map.get(OTHER_FAMILY);
    if (others) ordered.push({ family: OTHER_FAMILY, items: others });
    return ordered;
}
