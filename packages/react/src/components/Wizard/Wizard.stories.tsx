import type { Meta, StoryObj } from '@storybook/react-vite';
import { useForm, useStore } from '@tanstack/react-form';
import { useState } from 'react';
import { bindInput } from '../../form/bind.js';
import { FormField } from '../../form/FormField.js';
import { useValidators, validateFields } from '../../form/validators.js';
import { Checkbox } from '../Checkbox/Checkbox.js';
import { DataList, DataListItem } from '../DataList/DataList.js';
import { Field } from '../Field/Field.js';
import { Input } from '../Input/Input.js';
import { Result } from '../Result/Result.js';
import { Wizard } from './Wizard.js';

function Registration() {
    const v = useValidators();
    const form = useForm({ defaultValues: { name: '', email: '', street: '', city: '' } });
    const values = useStore(form.store, (state) => state.values);
    return (
        <Wizard
            className="max-w-2xl"
            steps={[
                {
                    label: 'Contact',
                    description: 'Name and email',
                    validate: () => validateFields(form, ['name', 'email']),
                },
                { label: 'Address', validate: () => validateFields(form, ['street', 'city']) },
            ]}
            renderStep={(index) =>
                index === 0 ? (
                    <div className="flex flex-col gap-3">
                        <form.Field name="name" validators={{ onChange: v.isRequired() }}>
                            {(field) => (
                                <FormField field={field} label="Name" required>
                                    <Input {...bindInput(field)} />
                                </FormField>
                            )}
                        </form.Field>
                        <form.Field name="email" validators={{ onChange: v.combine(v.isRequired(), v.isEmail()) }}>
                            {(field) => (
                                <FormField field={field} label="Email" required>
                                    <Input {...bindInput(field)} type="email" />
                                </FormField>
                            )}
                        </form.Field>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        <form.Field name="street" validators={{ onChange: v.isRequired() }}>
                            {(field) => (
                                <FormField field={field} label="Street" required>
                                    <Input {...bindInput(field)} />
                                </FormField>
                            )}
                        </form.Field>
                        <form.Field name="city" validators={{ onChange: v.isRequired() }}>
                            {(field) => (
                                <FormField field={field} label="City" required>
                                    <Input {...bindInput(field)} />
                                </FormField>
                            )}
                        </form.Field>
                    </div>
                )
            }
            summary={
                <DataList orientation="horizontal" divided>
                    <DataListItem label="Name">{values.name}</DataListItem>
                    <DataListItem label="Email">{values.email}</DataListItem>
                    <DataListItem label="Address">
                        {values.street}, {values.city}
                    </DataListItem>
                </DataList>
            }
            completed={<Result status="success" title="Signed up" description="We'll be in touch soon." />}
        />
    );
}

const meta = {
    title: 'Forms/Wizard',
    component: Wizard,
    args: { steps: [{ label: 'Contact' }, { label: 'Address' }], renderStep: () => null },
    parameters: { layout: 'padded' },
    render: () => <Registration />,
} satisfies Meta<typeof Wizard>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Multi-step form with TanStack Form: "Next" validates the step (validateFields), "Back" keeps everything, a
 * summary before finishing
 */
export const Playground: Story = {};

function OwnTextsDemo() {
    const [signIn, setSignIn] = useState(false);
    // New steps on every render: the check reads the current state
    const steps = [
        { label: 'Server' },
        {
            label: 'Sign-in',
            validate: async () => {
                await new Promise((done) => setTimeout(done, 400));
                return signIn || 'Sign-in was cancelled – try again';
            },
        },
    ];
    return (
        <Wizard
            steps={steps}
            finishLabel="Create"
            focusOnStepChange
            className="max-w-2xl"
            renderStep={(index) =>
                index === 0 ? (
                    <div className="flex flex-col gap-3">
                        <Field label="Host">
                            <Input mono />
                        </Field>
                        <Field label="Port">
                            <Input defaultValue="22" mono />
                        </Field>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        <Field label="User">
                            <Input defaultValue="root" data-autoselect />
                        </Field>
                        <Checkbox checked={signIn} onCheckedChange={setSignIn}>
                            Sign-in succeeds
                        </Checkbox>
                    </div>
                )
            }
            completed={<p className="text-sm">Connection created.</p>}
        />
    );
}

/**
 * `finishLabel` names the last button, `focusOnStepChange` moves the focus into each new step (here: the user name,
 * selected with data-autoselect), and `validate` returns a text – shown as the error of the step instead of the
 * general one
 */
export const OwnTexts: Story = { name: 'Own texts and focus', render: () => <OwnTextsDemo /> };
