import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Gallery from './Gallery.vue';

// Pictures as inline SVG, so Storybook and the tests need no network
const picture = (title: string, from: string, to: string) =>
    `data:image/svg+xml,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="1600" height="900" fill="url(#g)"/><text x="80" y="820" font-family="sans-serif" font-size="72" fill="#fff">${title}</text></svg>`
    )}`;

const images = [
    {
        src: picture('Reception', '#1e66f5', '#7c3aed'),
        alt: 'Reception area with a counter',
        caption: 'Reception on the first floor',
    },
    {
        src: picture('Open-plan office', '#0d9488', '#1e66f5'),
        alt: 'Open-plan office with rows of desks',
        caption: 'Engineering, 3rd floor',
    },
    {
        src: picture('Data center', '#0a0a0a', '#475569'),
        alt: 'Server racks in the data center',
        caption: 'Our own data center in Frankfurt',
    },
    { src: picture('Roof terrace', '#d97706', '#dc2626'), alt: 'Roof terrace overlooking the city' },
];

const meta = {
    title: 'Media/Gallery',
    component: Gallery,
    args: { images, label: 'Our office', thumbnails: true, fullscreen: true },
    argTypes: { images: { control: false } },
    render: (args) => ({
        components: { Gallery },
        setup: () => ({ args, page: ref(0) }),
        template: `
            <div class="flex max-w-2xl flex-col gap-3">
                <Gallery v-bind="args" v-model:page="page" />
                <span class="text-xs text-muted">Image: {{ page + 1 }}</span>
            </div>`,
    }),
} satisfies Meta<typeof Gallery>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithoutThumbnails: Story = { args: { thumbnails: false, fullscreen: false } };

// A short film as a slide: its poster, captions as WebVTT (no video file in the Storybook – set src to the film)
const captions = `data:text/vtt,${encodeURIComponent('WEBVTT\n\n00:00.000 --> 00:04.000\nWelcome to our office.\n')}`;
const tour = [
    ...images,
    {
        type: 'video' as const,
        src: '/tour.mp4',
        alt: 'Video: Tour of the office',
        poster: picture('Tour (video)', '#334155', '#0f172a'),
        caption: 'Tour with captions',
        tracks: [{ src: captions, srclang: 'en', label: 'English', default: true }],
    },
];

/**
 * The large view as a lightbox: zoom (buttons, + and −, Ctrl+wheel, two fingers), move, rotate, download, fill the
 * screen; arrow keys and swiping change the picture
 */
export const Lightbox: Story = { name: 'Lightbox with tools', args: { tools: true } };

/** A video slide (controls, captions track) next to the pictures */
export const Video: Story = { name: 'Video with captions', args: { images: tour, tools: true } };

/** The pictures load when they come near the view (loading="lazy") */
export const Lazy: Story = { name: 'Lazy loading', args: { lazy: true } };
