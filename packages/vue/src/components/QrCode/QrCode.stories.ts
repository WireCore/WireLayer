import type { Meta, StoryObj } from '@storybook/vue3-vite';
import QrCode from './QrCode.vue';

const logo = `data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="8" fill="#1e66f5"/><text x="20" y="27" text-anchor="middle" font-family="sans-serif" font-size="20" font-weight="700" fill="#fff">W</text></svg>'
)}`;

const meta = {
    title: 'Data/QrCode',
    component: QrCode,
    args: { value: 'https://wirecore.dev', size: 160, showValue: true, download: true },
    argTypes: { errorCorrection: { control: 'inline-radio', options: ['L', 'M', 'Q', 'H'] } },
    render: (args) => ({
        components: { QrCode },
        setup: () => ({ args }),
        template: `<QrCode v-bind="args" />`,
    }),
} satisfies Meta<typeof QrCode>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The code is an image named by its value; downloads as PNG and SVG */
export const Playground: Story = {};

/** Logo in the middle – error correction "H" keeps the code readable */
export const WithLogo: Story = {
    name: 'With logo',
    args: { logo, errorCorrection: 'H', showValue: false, download: false, label: 'WireLayer website' },
};
