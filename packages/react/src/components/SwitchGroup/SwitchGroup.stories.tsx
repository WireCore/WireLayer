import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Switch } from '../Switch/Switch.js';
import { SwitchGroup, type SwitchGroupProps } from './SwitchGroup.js';

function Notifications(args: SwitchGroupProps) {
    const [value, setValue] = useState(['deploy']);
    return (
        <div className="flex w-80 flex-col gap-3">
            <SwitchGroup {...args} value={value} onValueChange={setValue}>
                <Switch value="deploy" description="Succeeded or failed">
                    Deployments
                </Switch>
                <Switch value="backup">Backups</Switch>
                <Switch value="billing">Invoices</Switch>
            </SwitchGroup>
            <p className="text-xs text-muted">Value: {value.join(', ')}</p>
        </div>
    );
}

const meta = {
    title: 'Forms/SwitchGroup',
    component: SwitchGroup,
    args: { label: 'Notifications', helperText: 'Applies to all projects' },
    render: (args) => <Notifications {...args} />,
} satisfies Meta<typeof SwitchGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Switches with a value share the group's value (string[]) */
export const Playground: Story = {};

/** At most two switched on */
export const Maximum: Story = { args: { max: 2, helperText: 'At most two' } };
