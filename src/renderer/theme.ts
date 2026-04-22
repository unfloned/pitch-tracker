import { createTheme, MantineColorsTuple } from '@mantine/core';
import { fonts } from './theme/tokens';

/** Marigold-derived tuple (light→dark) tuned to the paper palette. */
const accent: MantineColorsTuple = [
    '#fdf6e5',
    '#f9ead0',
    '#f1d39f',
    '#e8bb6a',
    '#dba53b',
    '#c98c1e',
    '#b77612',
    '#95600e',
    '#744a0a',
    '#543505',
];

/** Moss-derived tuple for positive/offer states. */
const moss: MantineColorsTuple = [
    '#f0f4ee',
    '#dce5d9',
    '#bccaad',
    '#9caf80',
    '#7f9757',
    '#658341',
    '#4f6a32',
    '#3d5327',
    '#2e3e1e',
    '#1f2a15',
];

export const theme = createTheme({
    primaryColor: 'accent',
    colors: { accent, moss },
    defaultRadius: 4,
    fontFamily: fonts.ui,
    fontFamilyMonospace: fonts.mono,
    headings: {
        fontFamily: fonts.display,
        fontWeight: '500',
        sizes: {
            h1: { fontSize: '2rem', lineHeight: '1.05', fontWeight: '500' },
            h2: { fontSize: '1.5rem', lineHeight: '1.15', fontWeight: '500' },
            h3: { fontSize: '1.25rem', lineHeight: '1.25', fontWeight: '500' },
            h4: { fontSize: '1.05rem', lineHeight: '1.3', fontWeight: '600' },
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
            defaultProps: { radius: 4 },
            styles: { root: { fontWeight: 500 } },
        },
        Card: {
            defaultProps: { radius: 4, shadow: undefined, withBorder: true },
        },
        Paper: {
            defaultProps: { radius: 4, shadow: undefined },
        },
        Badge: {
            defaultProps: { radius: 2 },
        },
        Modal: {
            defaultProps: { radius: 0, shadow: 'none' },
        },
        Drawer: {
            defaultProps: { radius: 0, shadow: 'none' },
        },
    },
});
