import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { RadioGroup } from './RadioGroup.js';
import { RadioGroupItem } from './RadioGroupItem.js';

const meta = {
    title: 'Forms/RadioGroup',
    component: RadioGroup,
    args: { label: 'Company size', defaultValue: 'midsize', orientation: 'horizontal', disabled: false },
    argTypes: { orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] } },
    render: (args) => (
        <RadioGroup {...args}>
            <RadioGroupItem value="startup">Startup</RadioGroupItem>
            <RadioGroupItem value="midsize">Mid-sized</RadioGroupItem>
            <RadioGroupItem value="enterprise">Enterprise</RadioGroupItem>
            <RadioGroupItem value="public-sector" disabled>
                Public sector
            </RadioGroupItem>
        </RadioGroup>
    ),
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

function NumberValuesDemo() {
    const [timeout, setTimeout] = useState<number | null>(30);
    return (
        <div className="flex flex-col gap-3">
            <RadioGroup value={timeout} onValueChange={setTimeout} label="Idle timeout">
                <RadioGroupItem value={15}>15 s</RadioGroupItem>
                <RadioGroupItem value={30}>30 s</RadioGroupItem>
                <RadioGroupItem value={60}>60 s</RadioGroupItem>
            </RadioGroup>
            <span className="text-xs text-muted">
                Value: {timeout} ({typeof timeout})
            </span>
        </div>
    );
}

/** Number values: onValueChange gets numbers back (`RadioGroup<number>`, typed by the value) */
export const NumberValues: Story = { name: 'Number values', render: () => <NumberValuesDemo /> };
