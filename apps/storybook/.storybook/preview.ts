import type { Preview } from '@storybook/react-vite';
import './preview.css';

const preview: Preview = {
    parameters: {
        options: {
            storySort: {
                order: ['Getting started', ['Welcome', 'Accessibility', 'Migrating from PrimeVue'], 'Foundations'],
            },
        },
    },
};

export default preview;
