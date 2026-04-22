import { useCallback, useEffect, useState, type MouseEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ContextMenuItem {
    label: string;
    onClick: () => void;
    danger?: boolean;
    icon?: ReactNode;
}

interface State {
    x: number;
    y: number;
    items: ContextMenuItem[];
}

/**
 * Right-click context menu with paper styling.
 * Returns { onContextMenu, menu } — spread onContextMenu on any element,
 * render {menu} once at the root of the page (it portals to body).
 */
export function useContextMenu() {
    const [state, setState] = useState<State | null>(null);

    const open = useCallback((e: MouseEvent, items: ContextMenuItem[]) => {
        e.preventDefault();
        e.stopPropagation();
        setState({ x: e.clientX, y: e.clientY, items });
    }, []);

    const close = useCallback(() => setState(null), []);

    useEffect(() => {
        if (!state) return;
        const onDown = (e: globalThis.MouseEvent) => {
            const menu = document.getElementById('pt-context-menu');
            if (menu && !menu.contains(e.target as Node)) close();
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') close();
        };
        // Use capture for mousedown so a second right-click on another row
        // closes this one before the new one opens.
        window.addEventListener('mousedown', onDown, true);
        window.addEventListener('keydown', onKey);
        return () => {
            window.removeEventListener('mousedown', onDown, true);
            window.removeEventListener('keydown', onKey);
        };
    }, [state, close]);

    const menu = state
        ? createPortal(
              <div
                  id="pt-context-menu"
                  style={{
                      position: 'fixed',
                      top: Math.min(state.y, window.innerHeight - state.items.length * 32 - 16),
                      left: Math.min(state.x, window.innerWidth - 220),
                      minWidth: 180,
                      background: 'var(--paper)',
                      border: '1px solid var(--ink)',
                      boxShadow: '0 12px 28px rgba(0, 0, 0, 0.18)',
                      zIndex: 10000,
                      padding: 4,
                      borderRadius: 3,
                  }}
              >
                  {state.items.map((item, i) => (
                      <button
                          key={i}
                          type="button"
                          onClick={() => {
                              item.onClick();
                              close();
                          }}
                          style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              width: '100%',
                              padding: '6px 10px',
                              border: 'none',
                              background: 'transparent',
                              color: item.danger ? 'var(--rust)' : 'var(--ink)',
                              fontSize: 12.5,
                              fontFamily: 'var(--f-ui)',
                              textAlign: 'left',
                              cursor: 'pointer',
                              borderRadius: 2,
                          }}
                          onMouseEnter={(e) => {
                              e.currentTarget.style.background = item.danger
                                  ? 'rgba(178, 78, 40, 0.12)'
                                  : 'var(--paper-2)';
                          }}
                          onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                          }}
                      >
                          {item.icon && (
                              <span style={{ width: 14, display: 'inline-flex', alignItems: 'center' }}>
                                  {item.icon}
                              </span>
                          )}
                          <span style={{ flex: 1 }}>{item.label}</span>
                      </button>
                  ))}
              </div>,
              document.body,
          )
        : null;

    return { open, close, menu };
}
