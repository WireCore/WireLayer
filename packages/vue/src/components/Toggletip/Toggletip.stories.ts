import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Field from '../Field/Field.vue';
import Input from '../Input/Input.vue';
import Toggletip from './Toggletip.vue';

const meta = {
    title: 'Forms/Toggletip',
    component: Toggletip,
    args: { content: 'The VAT ID is at the top right of every invoice.', label: 'VAT ID' },
} satisfies Meta<typeof Toggletip>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A click shows the text in a bubble that is announced (role="status"); Escape or a click outside closes it */
export const Playground: Story = {};

/** At a field label: Field `labelHelp` (or the #label-help slot) */
export const AtField: Story = {
    name: 'At a field',
    render: () => ({
        components: { Field, Input },
        template: `
            <Field label="VAT ID" label-help="At the top right of every invoice, starts with DE." helper-text="For invoices to businesses" class="w-80">
                <Input placeholder="DE123456789" />
            </Field>`,
    }),
};
