import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import './i18n';

import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider, localStorageColorSchemeManager } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { App } from './App';
import { theme } from './theme';

const colorSchemeManager = localStorageColorSchemeManager({ key: 'simple-tracker-theme' });

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <MantineProvider
            theme={theme}
            defaultColorScheme="dark"
            colorSchemeManager={colorSchemeManager}
        >
            <Notifications position="bottom-right" />
            <App />
        </MantineProvider>
    </React.StrictMode>,
);
