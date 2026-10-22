import type { Meta, StoryObj } from '@storybook/react-vite';
import { revalidateLogic, useForm } from '@tanstack/react-form';
import { useState } from 'react';
import { z } from 'zod';
import { Button } from '../components/Button/Button.js';
import { Checkbox } from '../components/Checkbox/Checkbox.js';
import { FormErrorSummary } from '../components/FormErrorSummary/FormErrorSummary.js';
import { Input } from '../components/Input/Input.js';
import { Select } from '../components/Select/Select.js';
import { bindCheckbox, bindInput, bindValue } from './bind.js';
import { useFormErrors } from './errors-summary.js';
import { FormField } from './FormField.js';
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

function ContactForm() {
    const [sent, setSent] = useState('');
    const form = useForm({
        defaultValues: { name: '', email: '', service: '', consent: false as boolean },
        // Errors appear on submit and disappear while correcting – validating on blur would move the
        // fields below the moment the pointer goes down and swallow the click
        validationLogic: revalidateLogic(),
        validators: { onDynamic: schema },
        onSubmit: ({ value }) => setSent(`Sent: ${value.name} <${value.email}>`),
    });

    return (
        <form
            className="flex w-[380px] flex-col gap-3.5"
            noValidate
            onSubmit={(event) => {
                event.preventDefault();
                void form.handleSubmit();
            }}
        >
            <form.Field name="name">
                {(field) => (
                    <FormField field={field} label="Name" required>
                        <Input {...bindInput(field)} autoComplete="name" />
                    </FormField>
                )}
            </form.Field>
            <form.Field name="email">
                {(field) => (
                    <FormField field={field} label="Email" required helperText="For questions about your request">
                        <Input {...bindInput(field)} type="email" autoComplete="email" />
                    </FormField>
                )}
            </form.Field>
            <form.Field name="service">
                {(field) => (
                    <FormField field={field} label="Service" required>
                        <Select {...(bindValue(field) as { value: string })} items={services} />
                    </FormField>
                )}
            </form.Field>
            <form.Field name="consent">
                {(field) => (
                    <FormField field={field}>
                        <Checkbox {...bindCheckbox(field)}>I agree that my details may be processed.</Checkbox>
                    </FormField>
                )}
            </form.Field>
            <Button type="submit" className="self-start">
                Send request
            </Button>
            <p className="text-xs text-muted" aria-live="polite">
                {sent}
            </p>
        </form>
    );
}

const meta = {
    title: 'Forms/TanStack Form',
    component: ContactForm,
    parameters: { layout: 'padded' },
} satisfies Meta<typeof ContactForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

function SummaryForm() {
    const form = useForm({
        defaultValues: { name: '', email: '' },
        validationLogic: revalidateLogic(),
        validators: { onDynamic: schema.pick({ name: true, email: true }) },
    });
    const summary = useFormErrors(form);
    return (
        <form
            className="flex w-[380px] flex-col gap-3.5"
            noValidate
            onSubmit={(event) => {
                event.preventDefault();
                void form.handleSubmit();
            }}
        >
            <FormErrorSummary errors={summary.errors} focusKey={summary.attempts} />
            <form.Field name="name">
                {(field) => (
                    <FormField id="name" field={field} label="Name" required>
                        <Input {...bindInput(field)} autoComplete="name" />
                    </FormField>
                )}
            </form.Field>
            <form.Field name="email">
                {(field) => (
                    <FormField id="email" field={field} label="Email" required>
                        <Input {...bindInput(field)} type="email" autoComplete="email" />
                    </FormField>
                )}
            </form.Field>
            <Button type="submit" className="self-start">
                Send request
            </Button>
        </form>
    );
}

/**
 * useFormErrors lists the errors for FormErrorSummary: after every submit the summary takes the focus, the links lead
 * to the fields (FormField `id` = field name)
 */
export const WithErrorSummary: Story = { render: () => <SummaryForm /> };

function ValidatorsForm() {
    const v = useValidators();
    const form = useForm({
        defaultValues: { email: '', website: '', iban: '', phone: '', password: '', repeat: '' },
        validationLogic: revalidateLogic(),
    });
    return (
        <form
            className="flex w-[380px] flex-col gap-3.5"
            noValidate
            onSubmit={(event) => {
                event.preventDefault();
                void form.handleSubmit();
            }}
        >
            <form.Field name="email" validators={{ onDynamic: v.combine(v.isRequired(), v.isEmail()) }}>
                {(field) => (
                    <FormField field={field} label="Email" required>
                        <Input {...bindInput(field)} type="email" />
                    </FormField>
                )}
            </form.Field>
            <form.Field name="website" validators={{ onDynamic: v.isUrl() }}>
                {(field) => (
                    <FormField field={field} label="Website" optional>
                        <Input {...bindInput(field)} type="url" placeholder="https://" />
                    </FormField>
                )}
            </form.Field>
            <form.Field name="iban" validators={{ onDynamic: v.isIban() }}>
                {(field) => (
                    <FormField field={field} label="IBAN" optional>
                        <Input {...bindInput(field)} />
                    </FormField>
                )}
            </form.Field>
            <form.Field name="phone" validators={{ onDynamic: v.isPhone() }}>
                {(field) => (
                    <FormField field={field} label="Phone" optional>
                        <Input {...bindInput(field)} type="tel" />
                    </FormField>
                )}
            </form.Field>
            <form.Field name="password" validators={{ onDynamic: v.hasLength({ min: 12 }) }}>
                {(field) => (
                    <FormField field={field} label="Password" helperText="At least 12 characters">
                        <Input {...bindInput(field)} type="password" />
                    </FormField>
                )}
            </form.Field>
            <form.Field
                name="repeat"
                validators={{
                    onChange: v.matchesField(() => form.getFieldValue('password')),
                    onChangeListenTo: ['password'],
                }}
            >
                {(field) => (
                    <FormField field={field} label="Repeat password">
                        <Input {...bindInput(field)} type="password" />
                    </FormField>
                )}
            </form.Field>
            <Button type="submit" className="self-start">
                Check
            </Button>
        </form>
    );
}

/**
 * The validators of @wirecore/wirelayer-react/form with translated messages (useValidators follows the LocaleProvider); each
 * is a Standard Schema, so TanStack Form takes it directly
 */
export const Validators: Story = { render: () => <ValidatorsForm /> };

const taken = ['admin', 'anna', 'support'];
const available = async ({ value, signal }: { value: string; signal: AbortSignal }) => {
    // Stands in for fetch(`/api/users/${value}`, { signal })
    await new Promise((done, fail) => {
        const timer = setTimeout(done, 400);
        signal.addEventListener('abort', () => {
            clearTimeout(timer);
            fail(signal.reason);
        });
    });
    return taken.includes(value.toLowerCase()) ? 'This username is taken' : undefined;
};

function AsyncForm() {
    const form = useForm({ defaultValues: { user: '' } });
    return (
        <form.Field name="user" validators={{ onChangeAsync: available, onChangeAsyncDebounceMs: 500 }}>
            {(field) => (
                <FormField field={field} label="Username" helperText="Try “anna”">
                    <Input {...bindInput(field)} loading={field.state.meta.isValidating} className="w-[380px]" />
                </FormField>
            )}
        </form.Field>
    );
}

/**
 * Asynchronous check with debounce and abort: TanStack asks 500 ms after the last keystroke and hands over an
 * AbortSignal, so an outdated request is cancelled
 */
export const AsyncValidation: Story = { render: () => <AsyncForm /> };
