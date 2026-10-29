import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Field } from '../Field/Field.js';
import { PasswordInput } from './PasswordInput.js';

const meta = {
    title: 'Forms/PasswordInput',
    component: PasswordInput,
    args: { size: 'md', disabled: false, defaultVisible: false, autoComplete: 'new-password' },
    argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
    render: (args) => (
        <Field label="New password" helperText="At least 12 characters" required className="w-72">
            <PasswordInput {...args} />
        </Field>
    ),
} satisfies Meta<typeof PasswordInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Strength meter for choosing a new password – a hint, no rule */
export const Strength: Story = {
    render: () => (
        <Field label="New password" helperText="At least 12 characters" className="w-72">
            <PasswordInput autoComplete="new-password" strength />
        </Field>
    ),
};

const requirements = [
    { label: 'At least 12 characters', test: (value: string) => value.length >= 12 },
    { label: 'Upper- and lowercase letters', test: (value: string) => /[a-z]/.test(value) && /[A-Z]/.test(value) },
    { label: 'At least one digit', test: /\d/ },
    { label: 'At least one special character', test: /[^\p{L}\d]/u },
];

/** Checklist while typing: each rule with icon and text (never color alone), linked to the input */
export const Requirements: Story = {
    render: () => (
        <Field label="New password" className="w-72">
            <PasswordInput autoComplete="new-password" requirements={requirements} />
        </Field>
    ),
};

function ControlledVisibilityDemo() {
    const [visible, setVisible] = useState(false);
    return (
        <div className="flex w-72 flex-col gap-3">
            <Field label="Password">
                <PasswordInput visible={visible} onVisibleChange={setVisible} autoComplete="new-password" />
            </Field>
            <Field label="Repeat">
                <PasswordInput visible={visible} onVisibleChange={setVisible} autoComplete="new-password" />
            </Field>
            <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={visible} onChange={(event) => setVisible(event.target.checked)} /> Show
                passwords
            </label>
        </div>
    );
}

/** Visibility from outside (visible/onVisibleChange), e.g. one switch for two fields */
export const ControlledVisibility: Story = { render: () => <ControlledVisibilityDemo /> };

/**
 * Secrets the browser should not offer to save (tokens, passphrases, vault master passwords): `autoComplete="off"`;
 * `one-time-code` for one-time codes. `mono` sets the monospace font
 */
export const NotSaved: Story = {
    name: 'Not saved by the browser',
    render: () => (
        <div className="flex w-[380px] flex-col gap-3.5">
            <Field label="Vault master password">
                <PasswordInput autoComplete="off" />
            </Field>
            <Field label="Access token">
                <PasswordInput autoComplete="off" mono />
            </Field>
        </div>
    ),
};
