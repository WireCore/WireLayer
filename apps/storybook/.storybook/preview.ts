import type { Preview } from '@storybook/react-vite';
import './preview.css';

const preview: Preview = {
    parameters: {
        options: {
            storySort: { order: ['Getting started', ['Welcome', 'Accessibility'], 'Foundations'] },
        },
    },
};

export default preview;
