import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Spinner from '../Spinner/Spinner.vue';
import Center from './Center.vue';

const meta = {
    title: 'Layout/Center',
    component: Center,
    render: (args) => ({
        components: { Center, Spinner },
        setup: () => ({ args }),
        template: `
            <Center v-bind="args" class="h-40 rounded-xl border border-dashed border-line-2">
                <Spinner label="Loading" />
            </Center>`,
    }),
} satisfies Meta<typeof Center>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Content in the middle, horizontally and vertically */
export const Playground: Story = {};
