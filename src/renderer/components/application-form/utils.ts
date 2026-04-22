/** Mantine color name for the fit-score notification/alert variant. */
export function scoreColor(score: number): string {
    if (score >= 90) return 'teal';
    if (score >= 70) return 'green';
    if (score >= 50) return 'yellow';
    if (score > 0) return 'orange';
    return 'gray';
}
