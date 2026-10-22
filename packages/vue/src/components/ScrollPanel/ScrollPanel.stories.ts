import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import ScrollPanel from './ScrollPanel.vue';

const meta = {
    title: 'Layout/ScrollPanel',
    component: ScrollPanel,
    args: { label: 'Terms of use' },
    render: (args) => ({
        components: { ScrollPanel },
        setup: () => ({ args, paragraphs: Array.from({ length: 12 }, (_, index) => index + 1) }),
        template: `
            <ScrollPanel v-bind="args" class="h-56 w-80 border border-line">
                <div class="flex flex-col gap-3 p-4 text-sm">
                    <p v-for="n in paragraphs" :key="n">§ {{ n }} The provider delivers the services under this agreement.</p>
                </div>
            </ScrollPanel>`,
    }),
} satisfies Meta<typeof ScrollPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Scrollbars only on hover, faded edges and an event at the end (e.g. to load more) */
export const Options: Story = {
    render: () => ({
        components: { ScrollPanel },
        setup: () => ({
            reached: ref(''),
            lines: Array.from({ length: 30 }, (_, index) => `Log line ${index + 1}`),
        }),
        template: `
            <div class="flex flex-col gap-2">
                <ScrollPanel label="Log" scrollbars="hover" fade class="h-48 w-72 border border-line" @reach-end="reached = 'End reached'" @reach-start="reached = 'Start reached'">
                    <p v-for="line in lines" :key="line" class="px-3 py-1 font-mono text-xs">{{ line }}</p>
                </ScrollPanel>
                <span class="text-xs text-muted" aria-live="polite">{{ reached }}</span>
            </div>`,
    }),
};
