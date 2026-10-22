import type { Preview } from '@storybook/html-vite';
import {
    appearanceGlobalTypes,
    appearanceInitialGlobals,
    withAppearance,
} from '../../../apps/storybook/shared/theme.js';
// The built stylesheet, exactly as HTML pages use it (pnpm build regenerates it)
import '../dist/wirecore.css';

const preview: Preview = {
    globalTypes: appearanceGlobalTypes,
    initialGlobals: { ...appearanceInitialGlobals },
    decorators: [withAppearance],
    parameters: {
        layout: 'centered',
        docs: { source: { type: 'code', language: 'html' } },
        options: {
            storySort: {
                order: ['HTML', 'Buttons', 'Forms', 'Data', 'Feedback', 'Navigation', 'Overlays', 'Blocks'],
            },
        },
    },
};

export default preview;
