import { CodeXml, Server } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Steps from './Steps.vue';

const meta = {
    title: 'Navigation/Steps',
    component: Steps,
    args: {
        items: [{ label: 'Understand' }, { label: 'Build', icon: CodeXml }, { label: 'Operate', icon: Server }],
        current: 1,
        label: 'Project flow',
    },
    argTypes: {
        items: { control: false },
        current: { control: { type: 'range', min: 0, max: 3 } },
    },
    render: (args) => ({
        components: { Steps },
        setup: () => ({ args }),
        template: '<Steps v-bind="args" class="w-[380px]" />',
    }),
} satisfies Meta<typeof Steps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
