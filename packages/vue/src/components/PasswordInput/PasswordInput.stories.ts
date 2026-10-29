import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Field from '../Field/Field.vue';
import PasswordInput from './PasswordInput.vue';

const meta = {
    title: 'Forms/PasswordInput',
    component: PasswordInput,
    args: { size: 'md', disabled: false, defaultVisible: false, autocomplete: 'new-password' },
    argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
    render: (args) => ({
        components: { Field, PasswordInput },
        setup: () => ({ args }),
        template: `
            <Field label="New password" helper-text="At least 12 characters" required class="w-72">
                <PasswordInput v-bind="args" />
            </Field>`,
    }),
} satisfies Meta<typeof PasswordInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Strength meter for choosing a new password – a hint, no rule */
export const Strength: Story = {
    render: () => ({
        components: { Field, PasswordInput },
        template: `
            <Field label="New password" helper-text="At least 12 characters" class="w-72">
                <PasswordInput autocomplete="new-password" strength />
            </Field>`,
    }),
};

const requirements = [
    { label: 'At least 12 characters', test: (value: string) => value.length >= 12 },
    { label: 'Upper- and lowercase letters', test: (value: string) => /[a-z]/.test(value) && /[A-Z]/.test(value) },
    { label: 'At least one digit', test: /\d/ },
    { label: 'At least one special character', test: /[^\p{L}\d]/u },
];

/** Checklist while typing: each rule with icon and text (never color alone), linked to the input */
export const Requirements: Story = {
    render: () => ({
        components: { Field, PasswordInput },
        setup: () => ({ requirements }),
        template: `
            <Field label="New password" class="w-72">
                <PasswordInput autocomplete="new-password" :requirements="requirements" />
            </Field>`,
    }),
};

/** Visibility from outside (v-model:visible), e.g. one switch for two fields */
export const ControlledVisibility: Story = {
    render: () => ({
        components: { Field, PasswordInput },
        setup: () => ({ visible: ref(false) }),
        template: `
            <div class="flex w-72 flex-col gap-3">
                <Field label="Password"><PasswordInput v-model:visible="visible" autocomplete="new-password" /></Field>
                <Field label="Repeat"><PasswordInput v-model:visible="visible" autocomplete="new-password" /></Field>
                <label class="flex items-center gap-2 text-sm"><input v-model="visible" type="checkbox" /> Show passwords</label>
            </div>`,
    }),
};

/**
 * Secrets the browser should not offer to save (tokens, passphrases, vault master passwords): `autocomplete="off"`;
 * `one-time-code` for one-time codes. `mono` sets the monospace font
 */
export const NotSaved: Story = {
    name: 'Not saved by the browser',
    render: () => ({
        components: { Field, PasswordInput },
        template: `
            <div class="flex w-[380px] flex-col gap-3.5">
                <Field label="Vault master password"><PasswordInput autocomplete="off" /></Field>
                <Field label="Access token"><PasswordInput autocomplete="off" mono /></Field>
            </div>`,
    }),
};
