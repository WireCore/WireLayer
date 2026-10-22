import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Badge from '../Badge/Badge.vue';
import Button from '../Button/Button.vue';
import Group from './Group.vue';

const meta = {
    title: 'Layout/Group',
    component: Group,
    args: { gap: 'sm', justify: 'start', align: 'middle' },
    argTypes: {
        gap: { control: 'inline-radio', options: ['none', 'xs', 'sm', 'md', 'lg', 'xl'] },
        justify: { control: 'inline-radio', options: ['start', 'center', 'end', 'between'] },
        align: { control: 'inline-radio', options: ['middle', 'top', 'bottom', 'baseline', 'stretch'] },
    },
    render: (args) => ({
        components: { Badge, Group },
        setup: () => ({ args }),
        template: `
            <Group v-bind="args">
                <Badge variant="success">Online</Badge>
                <Badge>Frankfurt</Badge>
                <Badge variant="outline">Ubuntu 26.04</Badge>
                <Badge variant="info">8 vCPU</Badge>
            </Group>`,
    }),
} satisfies Meta<typeof Group>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Side by side, wrapping onto new lines */
export const Playground: Story = {};

/** Buttons at both ends; `grow` shares the width evenly */
export const Distribution: Story = {
    render: () => ({
        components: { Button, Group },
        template: `
            <div class="flex max-w-md flex-col gap-4">
                <Group justify="between">
                    <Button variant="outline">Back</Button>
                    <Button>Next</Button>
                </Group>
                <Group grow gap="sm">
                    <Button variant="outline">Cancel</Button>
                    <Button>Save</Button>
                </Group>
            </div>`,
    }),
};
