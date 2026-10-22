import type { Meta, StoryObj } from '@storybook/vue3-vite';
import CopyButton from './CopyButton.vue';

const meta = {
    title: 'Buttons/CopyButton',
    component: CopyButton,
    args: { value: '10.0.1.11', showValue: true, label: 'Copy IP address', size: 'sm' },
    argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
    render: (args) => ({
        components: { CopyButton },
        setup: () => ({ args }),
        template: `<CopyButton v-bind="args" />`,
    }),
} satisfies Meta<typeof CopyButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
