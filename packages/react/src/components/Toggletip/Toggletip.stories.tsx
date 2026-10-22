import type { Meta, StoryObj } from '@storybook/react-vite';
import { Field } from '../Field/Field.js';
import { Input } from '../Input/Input.js';
import { Toggletip } from './Toggletip.js';

const meta = {
    title: 'Forms/Toggletip',
    component: Toggletip,
    args: { content: 'The VAT ID is at the top right of every invoice.', label: 'VAT ID' },
} satisfies Meta<typeof Toggletip>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A click shows the text in a bubble that is announced (role="status"); Escape or a click outside closes it */
export const Playground: Story = {};

/** At a field label: Field `labelHelp` */
export const AtField: Story = {
    name: 'At a field',
    render: () => (
        <Field
            label="VAT ID"
            labelHelp="At the top right of every invoice, starts with DE."
            helperText="For invoices to businesses"
            className="w-80"
        >
            <Input placeholder="DE123456789" />
        </Field>
    ),
};
