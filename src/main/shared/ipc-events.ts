import type { BrowserWindow } from 'electron';
import type { RendererEventMap } from '@shared/events';

/**
 * Strictly-typed sender used by main-side modules to push events to the
 * renderer. The channel literal narrows the payload type so a typo or shape
 * mismatch is a compile error, not a runtime "this listener never fires".
 */
export type EventSender = <K extends keyof RendererEventMap>(
    channel: K,
    payload: RendererEventMap[K],
) => void;

/**
 * Build an EventSender that targets the current main window. Safe to call
 * before/after the window exists: when the window is missing or destroyed
 * the call is a silent no-op rather than a crash.
 */
export function createEventSender(getWindow: () => BrowserWindow | null): EventSender {
    return (channel, payload) => {
        const win = getWindow();
        if (win && !win.isDestroyed()) {
            win.webContents.send(channel, payload);
        }
    };
}
