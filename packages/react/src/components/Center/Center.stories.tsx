import type { Meta, StoryObj } from '@storybook/react-vite';
import { Spinner } from '../Spinner/Spinner.js';
import { Center } from './Center.js';

const meta = {
    title: 'Layout/Center',
    component: Center,
    render: (args) => (
        <Center {...args} className="h-40 rounded-xl border border-dashed border-line-2">
            <Spinner label="Loading" />
        </Center>
    ),
} satisfies Meta<typeof Center>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Content in the middle, horizontally and vertically */
export const Playground: Story = {};
