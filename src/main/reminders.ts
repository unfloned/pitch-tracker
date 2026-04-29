import { BrowserWindow, Notification } from 'electron';
import { listApplications } from './db';
import { createEventSender } from './ipc/events';

const REMINDER_STORAGE_KEY = 'followUpReminderSeen';
const FOLLOW_UP_DAYS = 7;

const seen = new Set<string>();

export function startFollowUpReminder(getWindow: () => BrowserWindow | null): void {
    const send = createEventSender(getWindow);

    const check = () => {
        const now = Date.now();
        const cutoff = now - FOLLOW_UP_DAYS * 24 * 60 * 60 * 1000;

        for (const app of listApplications()) {
            if (app.status !== 'applied') continue;
            if (!app.appliedAt) continue;
            const appliedMs = new Date(app.appliedAt).getTime();
            if (appliedMs > cutoff) continue;
            if (seen.has(app.id)) continue;

            seen.add(app.id);

            if (Notification.isSupported()) {
                const notification = new Notification({
                    title: 'Follow up?',
                    body: `${app.companyName || 'Application'} - ${FOLLOW_UP_DAYS}+ days without update`,
                    silent: false,
                });
                notification.on('click', () => {
                    const win = getWindow();
                    if (win && !win.isDestroyed()) {
                        win.show();
                        win.focus();
                        send('navigate:openApplication', app.id);
                    }
                });
                notification.show();
            }

            send('reminders:followUp', {
                applicationId: app.id,
                companyName: app.companyName,
                daysSinceApplied: Math.floor((now - appliedMs) / (24 * 60 * 60 * 1000)),
            });
        }
    };

    setTimeout(check, 60 * 1000);
    setInterval(check, 6 * 60 * 60 * 1000);
}
