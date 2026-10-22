import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox } from './Checkbox.js';

const meta = {
    title: 'Forms/Checkbox',
    component: Checkbox,
    args: {
        disabled: false,
        invalid: false,
        required: false,
        className: 'max-w-[380px]',
        children: 'I agree that my details may be processed to answer my inquiry.',
    },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const States: Story = {
    render: () => (
        <div className="flex flex-col gap-3">
            <Checkbox>Not selected</Checkbox>
            <Checkbox defaultChecked>Selected</Checkbox>
            <Checkbox checked="indeterminate">Partially selected</Checkbox>
            <Checkbox invalid>Invalid</Checkbox>
            <Checkbox disabled>Disabled</Checkbox>
        </div>
    ),
};
