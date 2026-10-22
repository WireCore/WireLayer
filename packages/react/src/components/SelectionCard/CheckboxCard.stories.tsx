import type { Meta, StoryObj } from '@storybook/react-vite';
import { Activity, Archive, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { CheckboxGroup } from '../CheckboxGroup/CheckboxGroup.js';
import { CheckboxCard } from './SelectionCard.js';

const meta = {
    title: 'Forms/CheckboxCard',
    component: CheckboxCard,
    args: { title: 'Backup', description: 'Daily, kept for 30 days', price: '€9 / month' },
    render: (args) => <CheckboxCard {...args} icon={Archive} className="w-80" />,
} satisfies Meta<typeof CheckboxCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A card that is one checkbox: the title names it, description and price describe it */
export const Playground: Story = {};

function Modules() {
    const [value, setValue] = useState(['backup']);
    return (
        <div className="flex w-[min(760px,90vw)] flex-col gap-3">
            <CheckboxGroup
                value={value}
                onValueChange={setValue}
                label="Add-ons"
                columns={3}
                helperText="Cancel anytime"
            >
                <CheckboxCard
                    value="backup"
                    title="Backup"
                    description="Daily, kept for 30 days"
                    price="€9"
                    icon={Archive}
                />
                <CheckboxCard
                    value="monitoring"
                    title="Monitoring"
                    description="Alerts by email and SMS"
                    price="€12"
                    icon={Activity}
                />
                <CheckboxCard
                    value="waf"
                    title="Firewall"
                    description="Protection against attacks"
                    price="€19"
                    icon={ShieldCheck}
                    disabled
                />
            </CheckboxGroup>
            <p className="text-xs text-muted">Value: {value.join(', ')}</p>
        </div>
    );
}

/** Several cards in a CheckboxGroup with a grid (`columns`) */
export const Grid: Story = { name: 'Grid', render: () => <Modules /> };
