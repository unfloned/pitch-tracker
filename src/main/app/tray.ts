import { Menu, nativeImage, Tray } from 'electron';
import { join } from 'node:path';
import { listCandidates } from '../modules/agents';
import { createWindow, openNewEntry, openQuickAddFromClipboard } from './window';

let tray: Tray | null = null;

function safeListCandidates() {
    try {
        return listCandidates(0);
    } catch {
        return [];
    }
}

function refreshTrayMenu(): void {
    if (!tray) return;
    const candidates = safeListCandidates().slice(0, 5);
    const candidateItems: Electron.MenuItemConstructorOptions[] = candidates.length
        ? candidates.map((c) => ({
              label: `${c.score >= 50 ? '★ ' : ''}${(c.title || 'Untitled').slice(0, 60)}${c.company ? ' - ' + c.company.slice(0, 30) : ''}`,
              click: () => {
                  if (c.sourceUrl) {
                      import('electron').then(({ shell }) => shell.openExternal(c.sourceUrl));
                  }
              },
          }))
        : [{ label: 'No candidates yet', enabled: false }];

    const menu = Menu.buildFromTemplate([
        { label: 'New entry', accelerator: 'CommandOrControl+N', click: openNewEntry },
        {
            label: 'Quick add from clipboard',
            accelerator: 'CommandOrControl+Shift+N',
            click: openQuickAddFromClipboard,
        },
        { label: 'Open tracker', click: () => createWindow() },
        { type: 'separator' },
        { label: 'Latest candidates', submenu: candidateItems },
        { type: 'separator' },
        { label: 'Quit', role: 'quit' },
    ]);
    tray.setContextMenu(menu);
}

export function createTray(): void {
    const iconPath = join(__dirname, '../../resources/tray-icon.png');
    const image = nativeImage.createFromPath(iconPath);
    if (image.isEmpty()) {
        console.warn('[tray] Icon not found at', iconPath, '- skipping tray.');
        return;
    }
    image.setTemplateImage(true);
    tray = new Tray(image);
    tray.setToolTip('Pitch Tracker');
    refreshTrayMenu();
    tray.on('click', () => createWindow());
    setInterval(refreshTrayMenu, 60 * 1000);
}
