import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Code from './Code.vue';

const meta = {
    title: 'Data/Code',
    component: Code,
    args: { code: 'data-theme' },
    render: (args) => ({
        components: { Code },
        setup: () => ({ args }),
        template: `
            <p class="max-w-md text-sm">
                Set the theme with <Code v-bind="args" /> on the <Code>&lt;html&gt;</Code> element – the look of
                InlineCode, without syntax colours and without shiki.
            </p>`,
    }),
} satisfies Meta<typeof Code>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
