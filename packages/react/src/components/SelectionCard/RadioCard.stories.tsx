import type { Meta, StoryObj } from '@storybook/react-vite';
import { Building2, Rocket, User } from 'lucide-react';
import { useState } from 'react';
import { RadioGroup } from '../RadioGroup/RadioGroup.js';
import { RadioCard } from './SelectionCard.js';

function Plans() {
    const [value, setValue] = useState<string | null>('pro');
    return (
        <div className="flex w-[min(760px,90vw)] flex-col gap-3">
            <RadioGroup value={value} onValueChange={setValue} label="Plan" columns={3} name="plan">
                <RadioCard value="basic" title="Basic" description="For individuals" price="€0" icon={User} />
                <RadioCard
                    value="pro"
                    title="Pro"
                    description="For teams of up to 20"
                    price="€29 / month"
                    icon={Rocket}
                />
                <RadioCard
                    value="enterprise"
                    title="Enterprise"
                    description="Custom contracts, SLA"
                    price="on request"
                    icon={Building2}
                />
            </RadioGroup>
            <p className="text-xs text-muted">Value: {value}</p>
        </div>
    );
}

const meta = {
    title: 'Forms/RadioCard',
    component: RadioCard,
    args: { value: 'pro', title: 'Pro' },
    render: () => <Plans />,
} satisfies Meta<typeof RadioCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Cards as the options of a RadioGroup (arrow keys move, a grid with `columns`) */
export const Playground: Story = {};
