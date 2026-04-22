import { Label } from '../primitives/Label';
import { FunnelStep } from './FunnelStep';
import type { AnalyticsData } from './useAnalyticsData';

export function FunnelSection({ data }: { data: AnalyticsData }) {
    return (
        <div style={{ padding: '22px 28px', borderBottom: '1px solid var(--rule-strong)' }}>
            <Label>Funnel</Label>
            <div style={{ marginTop: 16 }}>
                {data.funnel.map((s) => (
                    <FunnelStep
                        key={s.label}
                        label={s.label}
                        n={s.n}
                        total={data.total || 1}
                        peak={s.peak}
                    />
                ))}
            </div>
        </div>
    );
}
