import { createTheme, MantineColorsTuple } from '@mantine/core';
import { fonts } from './theme/tokens';

/** Amber accent tuple (light→dark) tuned to the v2 warm palette. */
const accent: MantineColorsTuple = [
    '#fff5e8',
    '#ffe5c8',
    '#ffd1a0',
    '#ffbb78',
    '#ffa850',
    '#ff9128',
    '#e87a14',
    '#c26416',
    '#9e500f',
    '#7a3d09',
];

/** Sage tuple for success/offer states. */
const moss: MantineColorsTuple = [
    '#f1f5ee',
    '#dde6d7',
    '#c1d2b6',
    '#a4bd93',
    '#8fb075',
    '#76985d',
    '#5e7e47',
    '#4a6b3a',
    '#39542c',
    '#2a3f20',
];

export const theme = createTheme({
    primaryColor: 'accent',
    colors: { accent, moss },
    defaultRadius: 7,
    fontFamily: fonts.ui,
    fontFamilyMonospace: fonts.mono,
    headings: {
        fontFamily: fonts.ui,
        fontWeight: '600',
        sizes: {
            h1: { fontSize: '2rem', lineHeight: '1.1', fontWeight: '600' },
            h2: { fontSize: '1.5rem', lineHeight: '1.2', fontWeight: '600' },
            h3: { fontSize: '1.2rem', lineHeight: '1.3', fontWeight: '600' },
            h4: { fontSize: '1rem', lineHeight: '1.35', fontWeight: '600' },
        },
    },
    spacing: {
        xs: '8px',
        sm: '12px',
        md: '16px',
        lg: '24px',
        xl: '32px',
    },
    components: {
        Button: {
            defaultProps: { radius: 7 },
            styles: { root: { fontWeight: 500 } },
        },
        Card: {
            defaultProps: { radius: 10, shadow: undefined, withBorder: false },
        },
        Paper: {
            defaultProps: { radius: 10, shadow: undefined },
        },
        Badge: {
            defaultProps: { radius: 6 },
        },
        Modal: {
            defaultProps: { radius: 12, shadow: 'none' },
        },
        Drawer: {
            defaultProps: { radius: 0, shadow: 'none' },
        },
    },
});
