import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import './i18n';

import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider, localStorageColorSchemeManager } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { HashRouter } from 'react-router-dom';
import { App } from './App';
import { theme } from './theme';

const colorSchemeManager = localStorageColorSchemeManager({ key: 'simple-tracker-theme' });

class RootErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { error: Error | null }
> {
    state = { error: null as Error | null };
    static getDerivedStateFromError(error: Error) {
        return { error };
    }
    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('[RootErrorBoundary]', error, info);
    }
    render() {
        if (this.state.error) {
            return (
                <div
                    style={{
                        padding: 24,
                        color: '#fff',
                        background: '#1a1a1e',
                        fontFamily: 'system-ui, sans-serif',
                        minHeight: '100vh',
                    }}
                >
                    <h2 style={{ color: '#ff6b6b' }}>App failed to render</h2>
                    <pre style={{ whiteSpace: 'pre-wrap' }}>
                        {this.state.error.message}
                        {'\n\n'}
                        {this.state.error.stack}
                    </pre>
                </div>
            );
        }
        return this.props.children;
    }
}

window.addEventListener('error', (e) => {
    console.error('[window.error]', e.error || e.message);
});
window.addEventListener('unhandledrejection', (e) => {
    console.error('[unhandledrejection]', e.reason);
});

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <RootErrorBoundary>
            <MantineProvider
                theme={theme}
                defaultColorScheme="dark"
                colorSchemeManager={colorSchemeManager}
            >
                <Notifications position="bottom-right" />
                <HashRouter>
                    <App />
                </HashRouter>
            </MantineProvider>
        </RootErrorBoundary>
    </React.StrictMode>,
);
