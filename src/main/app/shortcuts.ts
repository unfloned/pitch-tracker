import { globalShortcut } from 'electron';
import { openQuickAddFromClipboard } from './window';

export function registerGlobalShortcuts(): void {
    globalShortcut.register('CommandOrControl+Shift+N', openQuickAddFromClipboard);
}

export function unregisterGlobalShortcuts(): void {
    globalShortcut.unregisterAll();
}
