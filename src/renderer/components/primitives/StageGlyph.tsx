import type { ApplicationStatus } from '@shared/application';

/**
 * Geometric status glyph. Replaces colored Badge pills.
 * Maps each ApplicationStatus to a design-stage visual:
 *   draft               → open ring (ink-3)
 *   applied             → solid dot (accent)
 *   in_review           → half dot (accent)
 *   interview_scheduled → solid dot (rust)
 *   interviewed         → half dot (rust)
 *   offer_received      → solid dot (moss)
 *   accepted            → solid dot (moss)
 *   rejected            → ×
 *   withdrawn           → —
 */

type Shape = 'ring' | 'open' | 'solid' | 'half' | 'x' | 'dash';

const MAP: Record<ApplicationStatus, { color: string; shape: Shape }> = {
    draft:               { color: 'var(--ink-3)',  shape: 'open' },
    applied:             { color: 'var(--accent)', shape: 'solid' },
    in_review:           { color: 'var(--accent)', shape: 'half' },
    interview_scheduled: { color: 'var(--rust)',   shape: 'solid' },
    interviewed:         { color: 'var(--rust)',   shape: 'half' },
    offer_received:      { color: 'var(--moss)',   shape: 'solid' },
    accepted:            { color: 'var(--moss)',   shape: 'solid' },
    rejected:            { color: 'var(--ink-4)',  shape: 'x' },
    withdrawn:           { color: 'var(--ink-4)',  shape: 'dash' },
};

export function StageGlyph({ status, size = 10 }: { status: ApplicationStatus; size?: number }) {
    const { color, shape } = MAP[status] ?? { color: 'var(--ink-4)', shape: 'open' as Shape };
    const s = size;

    if (shape === 'x') {
        return (
            <svg width={s} height={s} viewBox="0 0 10 10" style={{ flexShrink: 0 }}>
                <path d="M2 2 L8 8 M8 2 L2 8" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
            </svg>
        );
    }
    if (shape === 'dash') {
        return (
            <svg width={s} height={s} viewBox="0 0 10 10" style={{ flexShrink: 0 }}>
                <path d="M2 5 L8 5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
            </svg>
        );
    }
    if (shape === 'ring') {
        return (
            <svg width={s} height={s} viewBox="0 0 10 10" style={{ flexShrink: 0 }}>
                <circle cx="5" cy="5" r="3.3" stroke={color} strokeWidth="1.3" fill="none" />
            </svg>
        );
    }
    if (shape === 'open') {
        return (
            <svg width={s} height={s} viewBox="0 0 10 10" style={{ flexShrink: 0 }}>
                <circle cx="5" cy="5" r="3" stroke={color} strokeWidth="1.3" fill="var(--card)" />
            </svg>
        );
    }
    if (shape === 'half') {
        return (
            <svg width={s} height={s} viewBox="0 0 10 10" style={{ flexShrink: 0 }}>
                <circle cx="5" cy="5" r="3.5" fill="var(--card)" stroke={color} strokeWidth="1.2" />
                <path d="M5 1.5 A3.5 3.5 0 0 1 5 8.5 Z" fill={color} />
            </svg>
        );
    }
    return (
        <svg width={s} height={s} viewBox="0 0 10 10" style={{ flexShrink: 0 }}>
            <circle cx="5" cy="5" r="3.3" fill={color} />
        </svg>
    );
}
