import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { useForm } from '@tanstack/vue-form';
import { ref } from 'vue';
import { bindInput } from '../../form/bind.js';
import FormField from '../../form/FormField.vue';
import { useValidators, validateFields } from '../../form/validators.js';
import Checkbox from '../Checkbox/Checkbox.vue';
import DataList from '../DataList/DataList.vue';
import DataListItem from '../DataList/DataListItem.vue';
import Field from '../Field/Field.vue';
import Input from '../Input/Input.vue';
import Result from '../Result/Result.vue';
import Wizard from './Wizard.vue';

const meta = {
    title: 'Forms/Wizard',
    component: Wizard,
    args: { steps: [{ label: 'Contact' }, { label: 'Address' }] },
    parameters: { layout: 'padded' },
    render: () => ({
        components: { DataList, DataListItem, FormField, Input, Result, Wizard },
        setup() {
            const v = useValidators();
            const form = useForm({ defaultValues: { name: '', email: '', street: '', city: '' } });
            const values = ref(form.state.values);
            form.store.subscribe(() => (values.value = form.state.values));
            const steps = [
                {
                    label: 'Contact',
                    description: 'Name and email',
                    validate: () => validateFields(form, ['name', 'email']),
                },
                { label: 'Address', validate: () => validateFields(form, ['street', 'city']) },
            ];
            return { form, steps, values, v, bindInput };
        },
        template: `
            <Wizard :steps="steps" class="max-w-2xl">
                <template #step="{ index }">
                    <div v-if="index === 0" class="flex flex-col gap-3">
                        <component :is="form.Field" name="name" :validators="{ onChange: v.isRequired() }" v-slot="{ field }">
                            <FormField :field="field" label="Name" required><Input v-bind="bindInput(field)" /></FormField>
                        </component>
                        <component :is="form.Field" name="email" :validators="{ onChange: v.combine(v.isRequired(), v.isEmail()) }" v-slot="{ field }">
                            <FormField :field="field" label="Email" required><Input v-bind="bindInput(field)" type="email" /></FormField>
                        </component>
                    </div>
                    <div v-else class="flex flex-col gap-3">
                        <component :is="form.Field" name="street" :validators="{ onChange: v.isRequired() }" v-slot="{ field }">
                            <FormField :field="field" label="Street" required><Input v-bind="bindInput(field)" /></FormField>
                        </component>
                        <component :is="form.Field" name="city" :validators="{ onChange: v.isRequired() }" v-slot="{ field }">
                            <FormField :field="field" label="City" required><Input v-bind="bindInput(field)" /></FormField>
                        </component>
                    </div>
                </template>
                <template #summary>
                    <DataList orientation="horizontal" divided>
                        <DataListItem label="Name">{{ values.name }}</DataListItem>
                        <DataListItem label="Email">{{ values.email }}</DataListItem>
                        <DataListItem label="Address">{{ values.street }}, {{ values.city }}</DataListItem>
                    </DataList>
                </template>
                <template #completed>
                    <Result status="success" title="Signed up" description="We'll be in touch soon." />
                </template>
            </Wizard>`,
    }),
} satisfies Meta<typeof Wizard>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Multi-step form with TanStack Form: "Next" validates the step (validateFields), "Back" keeps everything, a
 * summary before finishing
 */
export const Playground: Story = {};

/**
 * `finish-label` names the last button, `focus-on-step-change` moves the focus into each new step (here: the user
 * name, selected with data-autoselect), and `validate` returns a text – shown as the error of the step instead of the
 * general one
 */
export const OwnTexts: Story = {
    name: 'Own texts and focus',
    render: () => ({
        components: { Checkbox, Field, Input, Wizard },
        setup() {
            const signIn = ref(false);
            const steps = [
                { label: 'Server' },
                {
                    label: 'Sign-in',
                    validate: async () => {
                        await new Promise((done) => setTimeout(done, 400));
                        return signIn.value || 'Sign-in was cancelled – try again';
                    },
                },
            ];
            return { signIn, steps };
        },
        template: `
            <Wizard :steps="steps" finish-label="Create" focus-on-step-change class="max-w-2xl">
                <template #step="{ index }">
                    <div v-if="index === 0" class="flex flex-col gap-3">
                        <Field label="Host"><Input mono /></Field>
                        <Field label="Port"><Input model-value="22" mono /></Field>
                    </div>
                    <div v-else class="flex flex-col gap-3">
                        <Field label="User"><Input model-value="root" data-autoselect /></Field>
                        <Checkbox v-model:checked="signIn">Sign-in succeeds</Checkbox>
                    </div>
                </template>
                <template #completed><p class="text-sm">Connection created.</p></template>
            </Wizard>`,
    }),
};
