import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { pictures } from '../../../.storybook/pictures.js';
import { Image } from './Image.js';

const meta = {
    title: 'Media/Image',
    component: Image,
    args: { src: pictures[2]!.src, alt: pictures[2]!.alt, preview: true, className: 'h-48 w-72' },
} satisfies Meta<typeof Image>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** A picture that cannot be loaded shows the fallback */
export const Fallback: Story = {
    name: 'Fallback image',
    args: {
        src: 'data:image/png;base64,AAAA',
        alt: 'Server room (image missing)',
        fallbackSrc: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180"><rect width="320" height="180" fill="#e5e7eb"/><text x="160" y="96" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#4b5563">Image not available</text></svg>')}`,
        preview: false,
    },
};
