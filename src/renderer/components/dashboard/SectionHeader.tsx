import { Label } from '../primitives/Label';

export function SectionHeader({ title, count }: { title: string; count?: number }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Label>
                {title}
                {count !== undefined && count > 0 ? ` · ${count}` : ''}
            </Label>
            <div style={{ flex: 1, height: 1, background: 'var(--rule)' }} />
        </div>
    );
}
