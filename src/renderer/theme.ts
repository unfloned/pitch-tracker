import { createTheme, MantineColorsTuple } from '@mantine/core';

const accent: MantineColorsTuple = [
    '#f0f4ff',
    '#dce4ff',
    '#b4c3ff',
    '#8ba2ff',
    '#6987ff',
    '#5376ff',
    '#476cff',
    '#385ae6',
    '#2d4fce',
    '#1e41b7',
];

export const theme = createTheme({
    primaryColor: 'accent',
    colors: { accent },
    defaultRadius: 'md',
    fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, Oxygen, Ubuntu, sans-serif',
    headings: {
        fontWeight: '600',
        sizes: {
            h1: { fontSize: '2rem', lineHeight: '1.2' },
            h2: { fontSize: '1.5rem', lineHeight: '1.3' },
            h3: { fontSize: '1.25rem', lineHeight: '1.4' },
            h4: { fontSize: '1.05rem', lineHeight: '1.4' },
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
            defaultProps: {
                radius: 'md',
            },
        },
        Card: {
            defaultProps: {
                radius: 'lg',
            },
        },
        Paper: {
            defaultProps: {
                radius: 'lg',
            },
        },
    },
});
