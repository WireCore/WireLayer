import type { Meta, StoryObj } from '@storybook/react-vite';
import { Mail, Search } from 'lucide-react';
import { useState } from 'react';
import { Chip } from '../ChipGroup/Chip.js';
import { ChipGroup } from '../ChipGroup/ChipGroup.js';
import { Input } from '../Input/Input.js';
import { RadioGroup } from '../RadioGroup/RadioGroup.js';
import { RadioGroupItem } from '../RadioGroup/RadioGroupItem.js';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl.js';
import { SegmentedControlItem } from '../SegmentedControl/SegmentedControlItem.js';
import { Textarea } from '../Textarea/Textarea.js';
import { Field } from './Field.js';

const meta = {
    title: 'Forms/Field',
    component: Field,
    args: { label: 'Name', helperText: 'First and last name', error: '', required: false, disabled: false },
    render: (args) => (
        <Field {...args} className="w-[380px]">
            <Input placeholder="Jane Doe" />
        </Field>
    ),
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const TextFields: Story = {
    name: 'Text fields',
    parameters: { layout: 'padded' },
    render: () => (
        <div className="flex w-[380px] flex-col gap-3.5">
            <Field label="Name">
                <Input placeholder="Jane Doe" />
            </Field>
            <Field label="Email" error="Please enter a valid address.">
                <Input type="email" leadingIcon={Mail} defaultValue="max@company" />
            </Field>
            <Field label="Search">
                <Input type="search" leadingIcon={Search} placeholder="Search services or topics" />
            </Field>
            <Field label="Domain">
                <Input prefix="https://" suffix=".com" placeholder="customer-portal" />
            </Field>
            <Field label="Company (disabled)" disabled>
                <Input placeholder="—" />
            </Field>
            <Field label="Your message">
                <Textarea rows={3} placeholder="What would you like to build? Is there a timeline?" />
            </Field>
        </div>
    ),
};

export const Sizes: Story = {
    render: () => (
        <div className="flex w-[380px] flex-col gap-3.5">
            <Field label="Small">
                <Input size="sm" placeholder="32 px" />
            </Field>
            <Field label="Default">
                <Input placeholder="40 px" />
            </Field>
            <Field label="Large">
                <Input size="lg" placeholder="48 px" />
            </Field>
        </div>
    ),
};

function StatesDemo() {
    const [user, setUser] = useState('jklein');
    const [domain, setDomain] = useState('customer-portal');
    const [search, setSearch] = useState('Server');
    return (
        <div className="flex w-[380px] flex-col gap-3.5">
            <Field label="Username" success="This name is available.">
                <Input value={user} onChange={(event) => setUser(event.target.value)} />
            </Field>
            <Field label="Domain" helperText="Checking …">
                <Input value={domain} onChange={(event) => setDomain(event.target.value)} loading suffix=".com" />
            </Field>
            <Field label="Search">
                <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    clearable
                    placeholder="Search services or topics"
                />
            </Field>
            <Field label="Company" optional>
                <Input placeholder="Acme Inc." />
            </Field>
        </div>
    );
}

/** Success (green border, check icon, text in the description), loading, clear button and "(optional)" */
export const States: Story = { name: 'States', render: () => <StatesDemo /> };

/**
 * Own content instead of a text: `helperText`, `success`, `error` (and `label`) take React nodes – e.g. a hint with
 * a link. It stays part of the control's description (aria-describedby)
 */
export const RichTexts: Story = {
    name: 'Helper text with a link',
    render: () => (
        <Field
            label="IBAN"
            className="w-[380px]"
            helperText={
                <>
                    On your bank card or in online banking –{' '}
                    <a href="#help" className="underline">
                        where to find it
                    </a>
                </>
            }
        >
            <Input />
        </Field>
    ),
};

/**
 * SegmentedControl, RadioGroup and ChipGroup inside a Field: the Field's label names the group (visible), its helper
 * and error texts describe it – no `label` of their own needed
 */
export const Groups: Story = {
    name: 'Groups in a Field',
    render: () => (
        <div className="flex w-[380px] flex-col gap-4">
            <Field label="View" helperText="How the list is shown">
                <SegmentedControl defaultValue="list">
                    <SegmentedControlItem value="list">List</SegmentedControlItem>
                    <SegmentedControlItem value="grid">Grid</SegmentedControlItem>
                </SegmentedControl>
            </Field>
            <Field label="Plan" error="Choose a plan" required>
                <RadioGroup name="plan">
                    <RadioGroupItem value="basic">Basic</RadioGroupItem>
                    <RadioGroupItem value="pro">Pro</RadioGroupItem>
                </RadioGroup>
            </Field>
            <Field label="Services" helperText="Any number">
                <ChipGroup defaultValue={['web']}>
                    <Chip value="web">Web</Chip>
                    <Chip value="ai">AI</Chip>
                </ChipGroup>
            </Field>
        </div>
    ),
};
