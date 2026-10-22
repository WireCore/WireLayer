import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Watermark from './Watermark.vue';

const logo = `data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40"><text x="60" y="28" text-anchor="middle" font-family="sans-serif" font-size="22" font-weight="700" fill="#1e66f5">WireLayer</text></svg>'
)}`;

const meta = {
    title: 'Data/Watermark',
    component: Watermark,
    args: { text: 'Confidential', rotate: -22, opacity: 0.15, fontSize: 16 },
    render: (args) => ({
        components: { Watermark },
        setup: () => ({ args }),
        template: `
            <Watermark v-bind="args" class="w-[440px] rounded-lg border border-line p-5">
                <h3 class="text-base font-semibold">Quote 2026-118</h3>
                <p class="mt-2 text-sm text-muted">Scope of services, prices and terms. For internal use only – the watermark is decoration and is not read aloud.</p>
            </Watermark>`,
    }),
} satisfies Meta<typeof Watermark>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Repeated text over the content; clicks go through, screen readers skip it */
export const Playground: Story = {};

/** Two lines, steeper */
export const Multiline: Story = {
    name: 'Multiline',
    args: { text: ['Draft', 'As of 10/21/2026'], rotate: -35, gap: [60, 48] },
};

/** An image instead of the text */
export const WithImage: Story = {
    name: 'With image',
    args: { text: undefined, image: logo, imageWidth: 120, imageHeight: 40, opacity: 0.12 },
};
