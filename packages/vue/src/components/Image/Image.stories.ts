import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Image from './Image.vue';

// Picture as inline SVG, so Storybook and the tests need no network
const picture = `data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#0d9488"/><stop offset="1" stop-color="#1e66f5"/></linearGradient></defs><rect width="1600" height="900" fill="url(#g)"/><text x="80" y="820" font-family="sans-serif" font-size="72" fill="#fff">Data center</text></svg>'
)}`;

const meta = {
    title: 'Media/Image',
    component: Image,
    args: { src: picture, alt: 'Server racks in the data center', preview: true },
    render: (args) => ({
        components: { Image },
        setup: () => ({ args }),
        template: `<Image v-bind="args" class="w-80" />`,
    }),
} satisfies Meta<typeof Image>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** A picture that cannot be loaded shows the fallback (fallbackSrc) */
export const Fallback: Story = {
    name: 'Fallback image',
    args: {
        src: '/does-not-exist.jpg',
        alt: 'Server room (image missing)',
        fallbackSrc: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180"><rect width="320" height="180" fill="#e5e7eb"/><text x="160" y="96" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#4b5563">Image not available</text></svg>')}`,
        preview: true,
    },
};
