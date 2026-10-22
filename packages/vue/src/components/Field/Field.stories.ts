import { Mail, Search } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Input from '../Input/Input.vue';
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
