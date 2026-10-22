import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { revalidateLogic, useForm } from '@tanstack/vue-form';
import { ref, type ConcreteComponent } from 'vue';
import { z } from 'zod';
import Button from '../components/Button/Button.vue';
import Checkbox from '../components/Checkbox/Checkbox.vue';
import FormErrorSummary from '../components/FormErrorSummary/FormErrorSummary.vue';
import Input from '../components/Input/Input.vue';
import Select from '../components/Select/Select.vue';
import { bindCheckbox, bindInput, bindValue } from './bind.js';
import { useFormErrors } from './errors-summary.js';
import FormField from './FormField.vue';
import { useValidators } from './validators.js';

// Standard Schema: TanStack Form validates with zod directly
const schema = z.object({
    name: z.string().min(2, 'Enter your name'),
    email: z.email('Enter a valid address'),
    service: z.string({ error: 'Choose a service' }).min(1, 'Choose a service'),
    consent: z.literal(true, { error: 'Please agree' }),
});

const services = [
    { value: 'web', label: 'Software & Web' },
    { value: 'hosting', label: 'Hosting' },
    { value: 'cloud', label: 'Cloud & DevOps' },
];

const meta = {
    title: 'Forms/TanStack Form',
    // Generic component / required field prop: Storybook's Vue types can't infer args here
    component: FormField as ConcreteComponent,
    parameters: { layout: 'padded' },
    render: () => ({
        components: { Button, Checkbox, FormField, Input, Select },
        setup() {
            const sent = ref('');
            const form = useForm({
                defaultValues: { name: '', email: '', service: '', consent: false as boolean },
                // Errors appear on submit and disappear while correcting – validating on blur would move the
                // fields below the moment the pointer goes down and swallow the click
                validationLogic: revalidateLogic(),
                validators: { onDynamic: schema },
                onSubmit: ({ value }) => {
                    sent.value = `Sent: ${value.name} <${value.email}>`;
                },
            });
            return { form, sent, services, bindCheckbox, bindInput, bindValue };
        },
        template: `
            <form class="flex w-[380px] flex-col gap-3.5" novalidate @submit.prevent="form.handleSubmit()">
                <!-- In SFCs simply <form.Field>; runtime-compiled story templates need <component :is> -->
                <component :is="form.Field" name="name" v-slot="{ field }">
                    <FormField :field="field" label="Name" required>
                        <Input v-bind="bindInput(field)" autocomplete="name" />
                    </FormField>
                </component>
                <component :is="form.Field" name="email" v-slot="{ field }">
                    <FormField :field="field" label="Email" required helper-text="For questions about your request">
                        <Input v-bind="bindInput(field)" type="email" autocomplete="email" />
                    </FormField>
                </component>
                <component :is="form.Field" name="service" v-slot="{ field }">
                    <FormField :field="field" label="Service" required>
                        <Select v-bind="bindValue(field)" :items="services" />
                    </FormField>
                </component>
                <component :is="form.Field" name="consent" v-slot="{ field }">
                    <FormField :field="field">
                        <Checkbox v-bind="bindCheckbox(field)">
                            I agree that my details may be processed.
                        </Checkbox>
                    </FormField>
                </component>
                <Button type="submit" class="self-start">Send request</Button>
                <p class="text-xs text-muted" aria-live="polite">{{ sent }}</p>
            </form>`,
    }),
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Playground: Story = {};

/**
 * useFormErrors lists the errors for FormErrorSummary: after every submit the summary takes the focus, the links lead
 * to the fields (FormField `id` = field name)
 */
export const WithErrorSummary: Story = {
    render: () => ({
        components: { Button, FormErrorSummary, FormField, Input },
        setup() {
            const form = useForm({
                defaultValues: { name: '', email: '' },
                validationLogic: revalidateLogic(),
                validators: { onDynamic: schema.pick({ name: true, email: true }) },
            });
            const summary = useFormErrors(form);
            return { form, summary, bindInput };
        },
        template: `
            <form class="flex w-[380px] flex-col gap-3.5" novalidate @submit.prevent="form.handleSubmit()">
                <FormErrorSummary :errors="summary.errors.value" :focus-key="summary.attempts.value" />
                <component :is="form.Field" name="name" v-slot="{ field }">
                    <FormField id="name" :field="field" label="Name" required>
                        <Input v-bind="bindInput(field)" autocomplete="name" />
                    </FormField>
                </component>
                <component :is="form.Field" name="email" v-slot="{ field }">
                    <FormField id="email" :field="field" label="Email" required>
                        <Input v-bind="bindInput(field)" type="email" autocomplete="email" />
                    </FormField>
                </component>
                <Button type="submit" class="self-start">Send request</Button>
            </form>`,
    }),
};

/**
 * The validators of @wirecore/wirelayer-vue/form with translated messages (useValidators follows the LocaleProvider); each is a
 * Standard Schema, so TanStack Form takes it directly
 */
export const Validators: Story = {
    render: () => ({
        components: { Button, FormField, Input },
        setup() {
            const v = useValidators();
            const form = useForm({
                defaultValues: { email: '', website: '', iban: '', phone: '', password: '', repeat: '' },
                validationLogic: revalidateLogic(),
            });
            return { form, v, bindInput };
        },
        template: `
            <form class="flex w-[380px] flex-col gap-3.5" novalidate @submit.prevent="form.handleSubmit()">
                <component :is="form.Field" name="email" :validators="{ onDynamic: v.combine(v.isRequired(), v.isEmail()) }" v-slot="{ field }">
                    <FormField :field="field" label="Email" required><Input v-bind="bindInput(field)" type="email" /></FormField>
                </component>
                <component :is="form.Field" name="website" :validators="{ onDynamic: v.isUrl() }" v-slot="{ field }">
                    <FormField :field="field" label="Website" optional><Input v-bind="bindInput(field)" type="url" placeholder="https://" /></FormField>
                </component>
                <component :is="form.Field" name="iban" :validators="{ onDynamic: v.isIban() }" v-slot="{ field }">
                    <FormField :field="field" label="IBAN" optional><Input v-bind="bindInput(field)" /></FormField>
                </component>
                <component :is="form.Field" name="phone" :validators="{ onDynamic: v.isPhone() }" v-slot="{ field }">
                    <FormField :field="field" label="Phone" optional><Input v-bind="bindInput(field)" type="tel" /></FormField>
                </component>
                <component :is="form.Field" name="password" :validators="{ onDynamic: v.hasLength({ min: 12 }) }" v-slot="{ field }">
                    <FormField :field="field" label="Password" helper-text="At least 12 characters"><Input v-bind="bindInput(field)" type="password" /></FormField>
                </component>
                <component
                    :is="form.Field"
                    name="repeat"
                    :validators="{ onChange: v.matchesField(() => form.getFieldValue('password')), onChangeListenTo: ['password'] }"
                    v-slot="{ field }"
                >
                    <FormField :field="field" label="Repeat password"><Input v-bind="bindInput(field)" type="password" /></FormField>
                </component>
                <Button type="submit" class="self-start">Check</Button>
            </form>`,
    }),
};

/**
 * Asynchronous check with debounce and abort: TanStack asks 500 ms after the last keystroke and hands over an
 * AbortSignal, so an outdated request is cancelled
 */
export const AsyncValidation: Story = {
    render: () => ({
        components: { FormField, Input },
        setup() {
            const taken = ['admin', 'anna', 'support'];
            const form = useForm({ defaultValues: { user: '' } });
            const available = async ({ value, signal }: { value: string; signal: AbortSignal }) => {
                // Stands in for fetch(`/api/users/${value}`, { signal })
                await new Promise((done, fail) => {
                    const timer = setTimeout(done, 400);
                    signal.addEventListener('abort', () => (clearTimeout(timer), fail(signal.reason)));
                });
                return taken.includes(value.toLowerCase()) ? 'This username is taken' : undefined;
            };
            return { form, available, bindInput };
        },
        template: `
            <component
                :is="form.Field"
                name="user"
                :validators="{ onChangeAsync: available, onChangeAsyncDebounceMs: 500 }"
                v-slot="{ field }"
            >
                <FormField :field="field" label="Username" helper-text="Try “anna”" class="w-[380px]">
                    <Input v-bind="bindInput(field)" :loading="field.state.meta.isValidating" />
                </FormField>
            </component>`,
    }),
};
