import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { useForm } from '@tanstack/vue-form';
import { ref, type ConcreteComponent } from 'vue';
import Input from '../components/Input/Input.vue';
import { bindInput } from './bind.js';
import FormField from './FormField.vue';
import FormList from './FormList.vue';
import KeyValueEditor from './KeyValueEditor.vue';
import { useValidators } from './validators.js';

const meta = {
    title: 'Forms/FormList',
    // Required TanStack field prop: Storybook's Vue types can't infer args here
    component: FormList as ConcreteComponent,
    parameters: { layout: 'padded' },
    render: () => ({
        components: { FormField, FormList, Input },
        setup() {
            const v = useValidators();
            const form = useForm({
                defaultValues: { contacts: [{ name: 'Anna Berg', email: 'anna@example.com' }] },
            });
            const values = ref(form.state.values);
            form.store.subscribe(() => (values.value = form.state.values));
            return { form, v, values, bindInput, newContact: () => ({ name: '', email: '' }) };
        },
        template: `
            <div class="flex max-w-2xl flex-col gap-4">
                <component :is="form.Field" name="contacts" mode="array" v-slot="{ field }">
                    <FormList :field="field" label="Contacts" :new-item="newContact" :min="1" :max="4" :item-label="(n) => 'Contact ' + n" add-label="Add contact">
                        <template #item="{ index, itemLabel }">
                            <component :is="form.Field" :name="'contacts[' + index + '].name'" :validators="{ onBlur: v.isRequired() }" v-slot="{ field: name }">
                                <FormField :field="name" :label="'Name (' + itemLabel + ')'" class="min-w-48 flex-1"><Input v-bind="bindInput(name)" /></FormField>
                            </component>
                            <component :is="form.Field" :name="'contacts[' + index + '].email'" :validators="{ onBlur: v.isEmail() }" v-slot="{ field: email }">
                                <FormField :field="email" :label="'Email (' + itemLabel + ')'" class="min-w-48 flex-1"><Input v-bind="bindInput(email)" type="email" /></FormField>
                            </component>
                        </template>
                    </FormList>
                </component>
                <pre class="text-xs text-muted">{{ JSON.stringify(values.contacts) }}</pre>
            </div>`,
    }),
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A field array of TanStack Form: add, remove, move with the buttons or Alt+↑/↓ (the focus follows), at least one and
 * at most four entries; changes are announced
 */
export const Playground: Story = {};

/** Preset for key-value pairs (e.g. HTTP headers); duplicate keys are marked */
export const KeyValue: Story = {
    render: () => ({
        components: { KeyValueEditor },
        setup() {
            const form = useForm({ defaultValues: { headers: [{ key: 'Accept', value: 'application/json' }] } });
            const values = ref(form.state.values);
            form.store.subscribe(() => (values.value = form.state.values));
            return { form, values };
        },
        template: `
            <div class="flex max-w-2xl flex-col gap-4">
                <component :is="form.Field" name="headers" mode="array" v-slot="{ field }">
                    <KeyValueEditor :field="field" label="HTTP headers" key-placeholder="Name" value-placeholder="Value" />
                </component>
                <pre class="text-xs text-muted">{{ JSON.stringify(values.headers) }}</pre>
            </div>`,
    }),
};
