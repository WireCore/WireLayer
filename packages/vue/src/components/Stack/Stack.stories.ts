import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Button from '../Button/Button.vue';
import Stack from './Stack.vue';

const meta = {
    title: 'Layout/Stack',
    component: Stack,
    args: { gap: 'md', align: 'stretch' },
    argTypes: {
        gap: { control: 'inline-radio', options: ['none', 'xs', 'sm', 'md', 'lg', 'xl'] },
        align: { control: 'inline-radio', options: ['stretch', 'start', 'center', 'end'] },
    },
    render: (args) => ({
        components: { Button, Stack },
        setup: () => ({ args }),
        template: `
            <Stack v-bind="args" class="max-w-xs">
                <Button variant="outline">Profile</Button>
                <Button variant="outline">Security</Button>
                <Button variant="outline">Notifications</Button>
            </Stack>`,
    }),
} satisfies Meta<typeof Stack>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Children below each other with an even gap */
export const Playground: Story = {};

/** As a list (`as="ul"`) */
export const AsList: Story = {
    render: () => ({
        components: { Stack },
        template: `
            <Stack as="ul" gap="xs" class="text-sm">
                <li>Software &amp; Web</li>
                <li>Hosting</li>
                <li>Cloud &amp; DevOps</li>
            </Stack>`,
    }),
};
