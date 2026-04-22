import { Label } from '../primitives/Label';
import { deriveObservations } from './deriveObservations';
import type { AnalyticsData } from './useAnalyticsData';

/** Dark full-width block at the bottom with 3 qualitative takeaways. */
export function ObservationsStrip({ data }: { data: AnalyticsData }) {
    const items = deriveObservations({
        total: data.total,
        applied: data.applied,
        offers: data.offers,
        interviews: data.interviews,
        avgMatch: data.avgMatch,
        weeklyMax: data.weeklyMax,
        sources: data.sources,
    });

    return (
        <div
            style={{
                gridColumn: '1 / 3',
                padding: '22px 28px',
                background: 'var(--ink)',
                color: 'var(--paper)',
            }}
        >
            <Label color="var(--paper-3)">Observations · from your data</Label>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 32,
                    marginTop: 14,
                }}
            >
                {items.map((obs, i) => (
                    <div key={i}>
                        <span
                            className="serif"
                            style={{
                                fontSize: 32,
                                fontWeight: 500,
                                color: 'var(--accent)',
                                display: 'block',
                                lineHeight: 1,
                                marginBottom: 10,
                            }}
                        >
                            {String(i + 1).padStart(2, '0')}
                        </span>
                        <div
                            style={{
                                fontSize: 15,
                                fontWeight: 600,
                                color: 'var(--paper)',
                                marginBottom: 6,
                            }}
                        >
                            {obs.head}
                        </div>
                        <div
                            style={{
                                fontSize: 12.5,
                                color: 'var(--paper-3)',
                                lineHeight: 1.5,
                            }}
                        >
                            {obs.body}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
