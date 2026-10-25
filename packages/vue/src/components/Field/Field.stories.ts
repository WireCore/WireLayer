import { Mail, Search } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import ChipGroup from '../ChipGroup/ChipGroup.vue';
import Chip from '../ChipGroup/Chip.vue';
import Input from '../Input/Input.vue';
import RadioGroup from '../RadioGroup/RadioGroup.vue';
import RadioGroupItem from '../RadioGroup/RadioGroupItem.vue';
import SegmentedControl from '../SegmentedControl/SegmentedControl.vue';
import SegmentedControlItem from '../SegmentedControl/SegmentedControlItem.vue';
import Textarea from '../Textarea/Textarea.vue';
import Field from './Field.vue';

const meta = {
    title: 'Forms/Field',
    component: Field,
    args: { label: 'Name', helperText: 'First and last name', error: '', required: false, disabled: false },
    render: (args) => ({
        components: { Field, Input },
        setup: () => ({ args, value: ref('') }),
        template: `
            <Field v-bind="args" class="w-[380px]">
                <Input v-model="value" placeholder="Jane Doe" />
            </Field>`,
    }),
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const TextFields: Story = {
    name: 'Text fields',
    parameters: { layout: 'padded' },
    render: () => ({
        components: { Field, Input, Textarea },
        setup: () => ({ Mail, Search, email: ref('max@company') }),
        template: `
            <div class="flex w-[380px] flex-col gap-3.5">
                <Field label="Name">
                    <Input placeholder="Jane Doe" />
                </Field>
                <Field label="Email" error="Please enter a valid address.">
                    <Input v-model="email" type="email" :leading-icon="Mail" />
                </Field>
                <Field label="Search">
                    <Input type="search" :leading-icon="Search" placeholder="Search services or topics" />
                </Field>
                <Field label="Domain">
                    <Input prefix="https://" suffix=".com" placeholder="customer-portal" />
                </Field>
                <Field label="Company (disabled)" disabled>
                    <Input placeholder="—" />
                </Field>
                <Field label="Your message">
                    <Textarea rows="3" placeholder="What would you like to build? Is there a timeline?" />
                </Field>
            </div>`,
    }),
};

export const Sizes: Story = {
    render: () => ({
        components: { Field, Input },
        template: `
            <div class="flex w-[380px] flex-col gap-3.5">
                <Field label="Small"><Input size="sm" placeholder="32 px" /></Field>
                <Field label="Default"><Input placeholder="40 px" /></Field>
                <Field label="Large"><Input size="lg" placeholder="48 px" /></Field>
            </div>`,
    }),
};

/** Success (green border, check icon, text in the description), loading, clear button and "(optional)" */
export const States: Story = {
    name: 'States',
    render: () => ({
        components: { Field, Input },
        setup: () => ({ user: ref('jklein'), search: ref('Server'), domain: ref('customer-portal') }),
        template: `
            <div class="flex w-[380px] flex-col gap-3.5">
                <Field label="Username" success="This name is available.">
                    <Input v-model="user" />
                </Field>
                <Field label="Domain" helper-text="Checking …">
                    <Input v-model="domain" loading suffix=".com" />
                </Field>
                <Field label="Search">
                    <Input v-model="search" clearable placeholder="Search services or topics" />
                </Field>
                <Field label="Company" optional>
                    <Input placeholder="Acme Inc." />
                </Field>
            </div>`,
    }),
};

/**
 * Own content instead of a text: the slots `#helper-text`, `#success`, `#error` (and `#label`) – e.g. a hint with a
 * link. It stays part of the control's description (aria-describedby)
 */
export const RichTexts: Story = {
    name: 'Helper text with a link',
    render: () => ({
        components: { Field, Input },
        setup: () => ({ iban: ref('') }),
        template: `
            <Field label="IBAN" class="w-[380px]">
                <Input v-model="iban" />
                <template #helper-text>
                    On your bank card or in online banking – <a href="#help" class="underline">where to find it</a>
                </template>
            </Field>`,
    }),
};

/**
 * SegmentedControl, RadioGroup and ChipGroup inside a Field: the Field's label names the group (visible), its helper
 * and error texts describe it – no `label` of their own needed
 */
export const Groups: Story = {
    name: 'Groups in a Field',
    render: () => ({
        components: { Field, SegmentedControl, SegmentedControlItem, RadioGroup, RadioGroupItem, ChipGroup, Chip },
        template: `
            <div class="flex w-[380px] flex-col gap-4">
                <Field label="View" helper-text="How the list is shown">
                    <SegmentedControl default-value="list">
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
                <Field label="Services" helper-text="Any number">
                    <ChipGroup :default-value="['web']">
                        <Chip value="web">Web</Chip>
                        <Chip value="ai">AI</Chip>
                    </ChipGroup>
                </Field>
            </div>`,
    }),
};
