import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { computed, ref } from 'vue';
import Button from '../Button/Button.vue';
import Field from '../Field/Field.vue';
import Input from '../Input/Input.vue';
import FormErrorSummary from './FormErrorSummary.vue';

const meta = {
    title: 'Forms/FormErrorSummary',
    component: FormErrorSummary,
    args: {
        autoFocus: false,
        errors: [
            { message: 'Please enter your name', id: 'name' },
            { message: 'Please enter a valid email address', id: 'email' },
        ],
    },
    render: (args) => ({
        components: { FormErrorSummary },
        setup: () => ({ args }),
        template: '<FormErrorSummary v-bind="args" class="w-[420px]" />',
    }),
} satisfies Meta<typeof FormErrorSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/**
 * After submitting, the summary takes the focus (WCAG 3.3.1); each message leads to its field. Field `id` sets the
 * id of the control the link points to
 */
export const AfterSubmit: Story = {
    render: () => ({
        components: { Button, Field, FormErrorSummary, Input },
        setup() {
            const name = ref('');
            const email = ref('');
            const attempts = ref(0);
            const submitted = ref(false);
            const errors = computed(() =>
                submitted.value
                    ? [
                          !name.value && { message: 'Please enter your name', id: 'summary-name' },
                          !/^\S+@\S+\.\S+$/.test(email.value) && {
                              message: 'Please enter a valid email address',
                              id: 'summary-email',
                          },
                      ].filter((error) => !!error)
                    : []
            );
            const submit = () => {
                submitted.value = true;
                attempts.value++;
            };
            const errorOf = (id: string) => errors.value.find((error) => error.id === id)?.message;
            return { name, email, attempts, errors, submit, errorOf };
        },
        template: `
            <form class="flex w-[420px] flex-col gap-3.5" novalidate @submit.prevent="submit">
                <FormErrorSummary :errors="errors" :focus-key="attempts" />
                <Field id="summary-name" label="Name" required :error="errorOf('summary-name')">
                    <Input v-model="name" autocomplete="name" />
                </Field>
                <Field id="summary-email" label="Email" required :error="errorOf('summary-email')">
                    <Input v-model="email" type="email" autocomplete="email" />
                </Field>
                <Button type="submit" class="self-start">Send request</Button>
            </form>`,
    }),
};
