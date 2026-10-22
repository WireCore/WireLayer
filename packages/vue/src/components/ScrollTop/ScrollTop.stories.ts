import type { Meta, StoryObj } from '@storybook/vue3-vite';
import ScrollTop from './ScrollTop.vue';

const meta = {
    title: 'Navigation/ScrollTop',
    component: ScrollTop,
    args: { threshold: 200 },
    parameters: { layout: 'fullscreen' },
    render: (args) => ({
        components: { ScrollTop },
        setup: () => ({ args, sections: Array.from({ length: 30 }, (_, index) => index + 1) }),
        template: `
            <div class="mx-auto flex max-w-xl flex-col gap-4 p-8 text-sm">
                <p v-for="n in sections" :key="n">Section {{ n }}: Scroll down and the “Back to top” button appears.</p>
                <ScrollTop v-bind="args" />
            </div>`,
    }),
} satisfies Meta<typeof ScrollTop>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
