import type { Meta, StoryObj } from '@storybook/react-vite';
import { useForm, useStore } from '@tanstack/react-form';
import { Input } from '../components/Input/Input.js';
import { bindInput } from './bind.js';
import { FormField } from './FormField.js';
import { FormList } from './FormList.js';
import { KeyValueEditor } from './KeyValueEditor.js';
import { useValidators } from './validators.js';

function Contacts() {
    const v = useValidators();
    const form = useForm({ defaultValues: { contacts: [{ name: 'Anna Berg', email: 'anna@example.com' }] } });
    const contacts = useStore(form.store, (state) => state.values.contacts);
    return (
        <div className="flex max-w-2xl flex-col gap-4">
            <form.Field name="contacts" mode="array">
                {(field) => (
                    <FormList
                        field={field}
                        label="Contacts"
                        newItem={() => ({ name: '', email: '' })}
                        min={1}
                        max={4}
                        itemLabel={(n) => `Contact ${n}`}
                        addLabel="Add contact"
                        renderItem={({ index, itemLabel }) => (
                            <>
                                <form.Field name={`contacts[${index}].name`} validators={{ onBlur: v.isRequired() }}>
                                    {(name) => (
                                        <FormField field={name} label={`Name (${itemLabel})`}>
                                            <Input {...bindInput(name)} />
                                        </FormField>
                                    )}
                                </form.Field>
                                <form.Field name={`contacts[${index}].email`} validators={{ onBlur: v.isEmail() }}>
                                    {(email) => (
                                        <FormField field={email} label={`Email (${itemLabel})`}>
                                            <Input {...bindInput(email)} type="email" />
                                        </FormField>
                                    )}
                                </form.Field>
                            </>
                        )}
                    />
                )}
            </form.Field>
            <pre className="text-xs text-muted">{JSON.stringify(contacts)}</pre>
        </div>
    );
}

const meta = {
    title: 'Forms/FormList',
    component: Contacts,
    parameters: { layout: 'padded' },
} satisfies Meta<typeof Contacts>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A field array of TanStack Form: add, remove, move with the buttons or Alt+↑/↓ (the focus follows), at least one and
 * at most four entries; changes are announced
 */
export const Playground: Story = {};

function Headers() {
    const form = useForm({ defaultValues: { headers: [{ key: 'Accept', value: 'application/json' }] } });
    const headers = useStore(form.store, (state) => state.values.headers);
    return (
        <div className="flex max-w-2xl flex-col gap-4">
            <form.Field name="headers" mode="array">
                {(field) => (
                    <KeyValueEditor field={field} label="HTTP headers" keyPlaceholder="Name" valuePlaceholder="Value" />
                )}
            </form.Field>
            <pre className="text-xs text-muted">{JSON.stringify(headers)}</pre>
        </div>
    );
}

/** Preset for key-value pairs (e.g. HTTP headers); duplicate keys are marked */
export const KeyValue: Story = { render: () => <Headers /> };
