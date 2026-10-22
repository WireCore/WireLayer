import { revalidateLogic, useForm } from '@tanstack/react-form';
import {
    Button,
    Checkbox,
    DatePicker,
    FileUpload,
    FormErrorSummary,
    Input,
    PasswordInput,
    PhoneInput,
    Select,
    Text,
    toast,
    type NativeFile,
} from '@wirecore/wirelayer-native';
import { documentPicker } from '@wirecore/wirelayer-native/expo-document-picker';
import {
    bindCheckbox,
    bindInput,
    bindValue,
    FormField,
    useFormErrors,
    useValidators,
} from '@wirecore/wirelayer-native/form';
import { View } from 'react-native';

const services = [
    { value: 'web', label: 'Software & Web' },
    { value: 'hosting', label: 'Managed Hosting' },
    { value: 'cloud', label: 'Cloud & DevOps' },
];

// The documents from the system's file picker (expo-document-picker, in Expo Go included)
const pickers = [documentPicker()];

/** A contact form with TanStack Form: validators with built-in messages, the error summary after submitting */
export function FormScreen() {
    const v = useValidators();
    const form = useForm({
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            password: '',
            service: '',
            start: null as string | null,
            files: [] as NativeFile[],
            consent: false as boolean,
        },
        validationLogic: revalidateLogic(),
        onSubmit: ({ value }) => toast({ title: 'Request sent', description: value.email, type: 'success' }),
    });
    const summary = useFormErrors(form);

    return (
        <View className="gap-4">
            <Text variant="title">Request</Text>
            <FormErrorSummary errors={summary.errors} focusKey={summary.attempts} />
            <form.Field name="name" validators={{ onDynamic: v.combine(v.isRequired(), v.hasLength({ min: 2 })) }}>
                {(field) => (
                    <FormField id="name" field={field} label="Name" required>
                        <Input {...bindInput(field)} autoComplete="name" textContentType="name" />
                    </FormField>
                )}
            </form.Field>
            <form.Field name="email" validators={{ onDynamic: v.combine(v.isRequired(), v.isEmail()) }}>
                {(field) => (
                    <FormField id="email" field={field} label="Email" required>
                        <Input
                            {...bindInput(field)}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                            textContentType="emailAddress"
                        />
                    </FormField>
                )}
            </form.Field>
            <form.Field name="phone" validators={{ onDynamic: v.isPhone() }}>
                {(field) => (
                    <FormField id="phone" field={field} label="Phone" optional>
                        <PhoneInput value={field.state.value} onValueChange={field.handleChange} />
                    </FormField>
                )}
            </form.Field>
            <form.Field name="password" validators={{ onDynamic: v.hasLength({ min: 12 }) }}>
                {(field) => (
                    <FormField id="password" field={field} label="Password for the customer portal">
                        <PasswordInput
                            {...bindInput(field)}
                            strength
                            autoComplete="new-password"
                            textContentType="newPassword"
                        />
                    </FormField>
                )}
            </form.Field>
            <form.Field name="service" validators={{ onDynamic: v.isRequired() }}>
                {(field) => (
                    <FormField id="service" field={field} label="Service" required>
                        <Select {...(bindValue(field) as { value: string })} items={services} />
                    </FormField>
                )}
            </form.Field>
            <form.Field name="start">
                {(field) => (
                    <FormField id="start" field={field} label="Preferred start" optional>
                        <DatePicker {...(bindValue(field) as { value: string | null })} clearable showButtonBar />
                    </FormField>
                )}
            </form.Field>
            <form.Field name="files">
                {(field) => (
                    <FileUpload
                        label="Attachments"
                        pickers={pickers}
                        accept={['application/pdf', 'image/*']}
                        maxFiles={3}
                        hint="PDF or images, at most three"
                        onFilesChange={field.handleChange}
                    />
                )}
            </form.Field>
            <form.Field name="consent" validators={{ onDynamic: v.isRequired({ message: 'Please agree' }) }}>
                {(field) => (
                    <FormField id="consent" field={field}>
                        <Checkbox {...bindCheckbox(field)}>I agree that my details may be processed.</Checkbox>
                    </FormField>
                )}
            </form.Field>
            <Button onPress={() => void form.handleSubmit()}>Send request</Button>
        </View>
    );
}
