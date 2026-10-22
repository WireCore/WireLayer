import type { Meta, StoryObj } from '@storybook/react-vite';
import { Field } from '../Field/Field.js';
import { Input } from '../Input/Input.js';
import { Fieldset } from './Fieldset.js';

const meta = {
    title: 'Forms/Fieldset',
    component: Fieldset,
    args: {
        legend: 'Billing address',
        helperText: 'As it appears on the invoice',
        disabled: false,
        invalid: false,
        children: null,
    },
    argTypes: { children: { control: false } },
    render: (args) => (
        <Fieldset {...args} className="max-w-md">
            <Field label="Company">
                <Input />
            </Field>
            <Field label="Street and number">
                <Input />
            </Field>
            <div className="grid grid-cols-[8rem_1fr] gap-3">
                <Field label="ZIP code">
                    <Input inputMode="numeric" />
                </Field>
                <Field label="City">
                    <Input />
                </Field>
            </div>
        </Fieldset>
    ),
} satisfies Meta<typeof Fieldset>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithError: Story = { args: { invalid: true, errorText: 'Please enter the complete address' } };

/** The legend shows and hides the fields; disabled reaches every field (native fieldset) */
export const Collapsible: Story = {
    render: () => (
        <div className="flex w-[380px] flex-col gap-4">
            <Fieldset legend="Shipping address" collapsible defaultOpen={false} helperText="Only if different">
                <Field label="Street">
                    <Input />
                </Field>
                <Field label="City">
                    <Input />
                </Field>
            </Fieldset>
            <Fieldset legend="Billing address (locked)" collapsible disabled>
                <Field label="Street">
                    <Input />
                </Field>
            </Fieldset>
        </div>
    ),
};
