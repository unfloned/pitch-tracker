import { Label } from '../primitives/Label';

export function ErrorBanner({ message }: { message: string }) {
    return (
        <div
            style={{
                padding: 12,
                border: '1px solid var(--rust)',
                background: 'rgba(178, 78, 40, 0.08)',
                fontSize: 12.5,
                color: 'var(--rust)',
                marginBottom: 16,
            }}
        >
            <Label color="var(--rust)">Error</Label>
            <div style={{ marginTop: 4 }}>{message}</div>
        </div>
    );
}
