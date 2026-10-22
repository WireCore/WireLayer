import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../Button/Button.js';
import { Stack } from './Stack.js';

const meta = {
    title: 'Layout/Stack',
    component: Stack,
    args: { gap: 'md', align: 'stretch' },
    argTypes: {
        gap: { control: 'inline-radio', options: ['none', 'xs', 'sm', 'md', 'lg', 'xl'] },
        align: { control: 'inline-radio', options: ['stretch', 'start', 'center', 'end'] },
    },
    render: (args) => (
        <Stack {...args} className="max-w-xs">
            <Button variant="outline">Profile</Button>
            <Button variant="outline">Security</Button>
            <Button variant="outline">Notifications</Button>
        </Stack>
    ),
} satisfies Meta<typeof Stack>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Children below each other with an even gap */
export const Playground: Story = {};

/** As a list (`as="ul"`) */
export const AsList: Story = {
    render: () => (
        <Stack as="ul" gap="xs" className="text-sm">
            <li>Software &amp; Web</li>
            <li>Hosting</li>
            <li>Cloud &amp; DevOps</li>
        </Stack>
    ),
};
