import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { revalidateLogic, useForm } from '@tanstack/react-form';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { z } from 'zod';
import { Button } from '../components/Button/Button.js';
import { Checkbox } from '../components/Checkbox/Checkbox.js';
import { FormErrorSummary } from '../components/FormErrorSummary/FormErrorSummary.js';
import { Input } from '../components/Input/Input.js';
import { PasswordInput } from '../components/PasswordInput/PasswordInput.js';
import { PhoneInput } from '../components/PhoneInput/PhoneInput.js';
import { Select } from '../components/Select/Select.js';
import { Text } from '../components/Text/Text.js';
import { bindCheckbox, bindInput, bindValue } from './bind.js';
import { useFormErrors } from './errors-summary.js';
import { FormField } from './FormField.js';
import { FormList } from './FormList.js';
import { KeyValueEditor } from './KeyValueEditor.js';
import { useValidators } from './validators.js';

// Standard Schema: TanStack Form validates with zod directly
const schema = z.object({
    name: z.string().min(2, 'Enter your name'),
    email: z.email('Enter a valid email address'),
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
        // Errors appear on submit and disappear while correcting
        validationLogic: revalidateLogic(),
        validators: { onDynamic: schema },
        onSubmit: ({ value }) => setSent(`Sent: ${value.name} <${value.email}>`),
    });
    const summary = useFormErrors(form);

    return (
        <View className="w-[360px] gap-3.5">
            <FormErrorSummary errors={summary.errors} focusKey={summary.attempts} />
            <form.Field name="name">
                {(field) => (
                    <FormField id="name" field={field} label="Name" required>
                        <Input {...bindInput(field)} autoComplete="name" textContentType="name" />
                    </FormField>
                )}
            </form.Field>
            <form.Field name="email">
                {(field) => (
                    <FormField id="email" field={field} label="Email" required helperText="For follow-up questions">
                        <Input
                            {...bindInput(field)}
                            keyboardType="email-address"
                            autoComplete="email"
                            textContentType="emailAddress"
                            autoCapitalize="none"
                        />
                    </FormField>
                )}
            </form.Field>
            <form.Field name="service">
                {(field) => (
                    <FormField id="service" field={field} label="Service" required>
                        <Select {...(bindValue(field) as { value: string })} items={services} />
                    </FormField>
                )}
            </form.Field>
            <form.Field name="consent">
                {(field) => (
                    <FormField id="consent" field={field}>
                        <Checkbox {...bindCheckbox(field)}>I agree that my details may be processed.</Checkbox>
                    </FormField>
                )}
            </form.Field>
            <Button className="self-start" onPress={() => void form.handleSubmit()}>
                Send request
            </Button>
            <Text variant="muted" aria-live="polite">
                {sent}
            </Text>
        </View>
    );
}

const meta = {
    title: 'Forms/TanStack Form',
    component: ContactForm,
    parameters: { layout: 'padded' },
} satisfies Meta<typeof ContactForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * zod schema, errors after the first submit: FormErrorSummary takes the focus and leads to the fields (FormField `id`
 * = field name)
 */
export const Playground: Story = {};

function ValidatorsForm() {
    const v = useValidators();
    const form = useForm({
        defaultValues: { email: '', iban: '', phone: '', password: '', repeat: '' },
        validationLogic: revalidateLogic(),
    });
    return (
        <View className="w-[360px] gap-3.5">
            <form.Field name="email" validators={{ onDynamic: v.combine(v.isRequired(), v.isEmail()) }}>
                {(field) => (
                    <FormField field={field} label="Email" required>
                        <Input {...bindInput(field)} keyboardType="email-address" autoCapitalize="none" />
                    </FormField>
                )}
            </form.Field>
            <form.Field name="iban" validators={{ onDynamic: v.isIban() }}>
                {(field) => (
                    <FormField field={field} label="IBAN" optional>
                        <Input {...bindInput(field)} autoCapitalize="characters" />
                    </FormField>
                )}
            </form.Field>
            <form.Field name="phone" validators={{ onDynamic: v.isPhone() }}>
                {(field) => (
                    <FormField field={field} label="Phone" optional>
                        <PhoneInput value={field.state.value} onValueChange={field.handleChange} />
                    </FormField>
                )}
            </form.Field>
            <form.Field name="password" validators={{ onDynamic: v.hasLength({ min: 12 }) }}>
                {(field) => (
                    <FormField field={field} label="Password" helperText="At least 12 characters">
                        <PasswordInput {...bindInput(field)} strength autoComplete="new-password" />
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
                        <PasswordInput {...bindInput(field)} autoComplete="new-password" />
                    </FormField>
                )}
            </form.Field>
            <Button className="self-start" onPress={() => void form.handleSubmit()}>
                Check
            </Button>
        </View>
    );
}

/** The validators of @wirecore/wirelayer-native/form with translated messages (useValidators follows the LocaleProvider) */
export const Validators: Story = { render: () => <ValidatorsForm /> };

function ListForm() {
    const form = useForm({
        defaultValues: {
            contacts: [{ name: 'Anna Berg', email: 'anna@company.com' }],
            headers: [{ key: 'Accept', value: 'application/json' }],
        },
    });
    return (
        <ScrollView className="h-[640px] w-[360px]" contentContainerClassName="gap-5">
            <form.Field name="contacts" mode="array">
                {(list) => (
                    <FormList
                        field={list}
                        label="Contacts"
                        itemLabel={(position) => `Contact ${position}`}
                        addLabel="Add contact"
                        newItem={() => ({ name: '', email: '' })}
                        max={3}
                        renderItem={({ index, itemLabel }) => (
                            <>
                                <form.Field name={`contacts[${index}].name`}>
                                    {(field) => (
                                        <Input
                                            {...bindInput(field)}
                                            aria-label={`Name, ${itemLabel}`}
                                            placeholder="Name"
                                        />
                                    )}
                                </form.Field>
                                <form.Field name={`contacts[${index}].email`}>
                                    {(field) => (
                                        <Input
                                            {...bindInput(field)}
                                            aria-label={`Email, ${itemLabel}`}
                                            placeholder="Email"
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                        />
                                    )}
                                </form.Field>
                            </>
                        )}
                    />
                )}
            </form.Field>
            <form.Field name="headers" mode="array">
                {(list) => (
                    <KeyValueEditor field={list} label="HTTP headers" keyPlaceholder="Name" valuePlaceholder="Value" />
                )}
            </form.Field>
        </ScrollView>
    );
}

/** FormList (FieldArray) with move up/down and remove – also as screen reader actions – and KeyValueEditor */
export const Lists: Story = { render: () => <ListForm /> };
