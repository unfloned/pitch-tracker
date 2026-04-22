interface Input {
    total: number;
    applied: number;
    offers: number;
    interviews: number;
    avgMatch: number;
    weeklyMax: number;
    sources: { src: string; apps: number; offers: number }[];
}

export interface Observation {
    head: string;
    body: string;
}

/**
 * Produce 3 qualitative takes on the user's history for the "Observations"
 * panel. Deliberately opinionated and grounded in the numbers — not motivational.
 * Always returns exactly 3 items so the 3-column strip is filled.
 */
export function deriveObservations(d: Input): Observation[] {
    if (d.total === 0) {
        return [
            {
                head: 'Nothing here yet.',
                body: 'Once you add applications, this space fills in with patterns from your data.',
            },
            {
                head: 'Paper, not dashboard.',
                body: 'Observations are local and editable. They describe what happened, not what to feel.',
            },
            {
                head: 'Quiet by default.',
                body: 'When there is nothing to say, this page will stay quiet.',
            },
        ];
    }

    const out: Observation[] = [];

    if (d.offers > 0) {
        out.push({
            head: `${d.offers} offer${d.offers > 1 ? 's' : ''} logged.`,
            body: `Out of ${d.applied} sent, ${((d.offers / Math.max(1, d.applied)) * 100).toFixed(1)}% came back as offers. That is above the usual job-board baseline.`,
        });
    } else if (d.interviews > 0) {
        out.push({
            head: `${d.interviews} interview${d.interviews > 1 ? 's' : ''} in motion.`,
            body: 'You are past the hardest part — the reply. Sort by stage and focus on the ones sitting in "scheduled".',
        });
    } else {
        out.push({
            head: 'Volume without replies.',
            body: `${d.applied} sent, no interviews yet. Tailor the next 5 per role — same time, better signal.`,
        });
    }

    if (d.sources.length > 0) {
        const top = d.sources[0];
        if (top.apps >= 3) {
            out.push({
                head: `${top.src} is the top funnel.`,
                body: `${top.apps} applications from there, ${top.offers || 0} offer${top.offers === 1 ? '' : 's'}. Keep it, but spread so one channel going cold doesn't stop the week.`,
            });
        }
    }

    if (d.avgMatch > 0) {
        out.push({
            head: `Match avg ${d.avgMatch}/100.`,
            body:
                d.avgMatch >= 70
                    ? 'You are applying to roles that actually fit. Quality > volume pays off here.'
                    : d.avgMatch >= 50
                      ? 'Middling fit across the board. Try being choosier — under 60, ask if it is worth the cover letter.'
                      : 'Fit is low on average. Either the scoring is too strict, or you are applying too wide.',
        });
    }

    while (out.length < 3) {
        out.push({
            head: 'Still reading.',
            body: 'More data will sharpen the signal here. Keep logging.',
        });
    }

    return out.slice(0, 3);
}
