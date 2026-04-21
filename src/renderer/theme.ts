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
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif',
    headings: { fontWeight: '600' },
});
