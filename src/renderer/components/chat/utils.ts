/** "14:32:08" — short wall-clock stamp used on each message. */
export function formatTime(d: Date): string {
    return d.toLocaleTimeString('de', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
}

/** "22 · APR · 2026" — marginalia header at the top of each thread. */
export function formatDateHeader(d: Date): string {
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return `${day} · ${months[d.getMonth()]} · ${d.getFullYear()}`;
}
