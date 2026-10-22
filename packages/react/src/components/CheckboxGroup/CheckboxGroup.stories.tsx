import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Checkbox } from '../Checkbox/Checkbox.js';
import { CheckboxGroup, type CheckboxGroupProps } from './CheckboxGroup.js';

function Channels(args: CheckboxGroupProps) {
    const [value, setValue] = useState(['mail']);
    return (
        <div className="flex flex-col gap-3">
            <CheckboxGroup {...args} value={value} onValueChange={setValue} name="channels">
                <Checkbox value="mail">Email</Checkbox>
                <Checkbox value="sms">SMS</Checkbox>
                <Checkbox value="push">Push notification</Checkbox>
            </CheckboxGroup>
            <p className="text-xs text-muted">Value: {value.join(', ')}</p>
        </div>
    );
}

const meta = {
    title: 'Forms/CheckboxGroup',
    component: CheckboxGroup,
    args: { label: 'Notifications', helperText: 'Choose how we can reach you.' },
    argTypes: { orientation: { control: 'inline-radio', options: ['vertical', 'horizontal'] } },
    render: (args) => <Channels {...args} />,
} satisfies Meta<typeof CheckboxGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One value for the group (string[]), named by its label, described by the helper text */
export const Playground: Story = {};

/** At most two: the others are disabled until one is unticked (announced) */
export const Maximum: Story = { args: { max: 2, helperText: 'At most two channels' } };

/** Side by side, with an error */
export const ErrorState: Story = {
    name: 'Error',
    args: { orientation: 'horizontal', required: true, error: 'Select at least one channel' },
};
