import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from '../Button/Button.js';
import { Field } from '../Field/Field.js';
import { Input } from '../Input/Input.js';
import { FormErrorSummary } from './FormErrorSummary.js';

const meta = {
    title: 'Forms/FormErrorSummary',
    component: FormErrorSummary,
    args: {
        autoFocus: false,
        className: 'w-[420px]',
        errors: [
            { message: 'Please enter your name', id: 'name' },
            { message: 'Please enter a valid email address', id: 'email' },
        ],
    },
} satisfies Meta<typeof FormErrorSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

function AfterSubmitDemo() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [attempts, setAttempts] = useState(0);
    const errors =
        attempts > 0
            ? [
                  !name && { message: 'Please enter your name', id: 'summary-name' },
                  !/^\S+@\S+\.\S+$/.test(email) && {
                      message: 'Please enter a valid email address',
                      id: 'summary-email',
                  },
              ].filter((error) => !!error)
            : [];
    const errorOf = (id: string) => errors.find((error) => error.id === id)?.message;
    return (
        <form
            className="flex w-[420px] flex-col gap-3.5"
            noValidate
            onSubmit={(event) => {
                event.preventDefault();
                setAttempts((count) => count + 1);
            }}
        >
            <FormErrorSummary errors={errors} focusKey={attempts} />
            <Field id="summary-name" label="Name" required error={errorOf('summary-name')}>
                <Input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" />
            </Field>
            <Field id="summary-email" label="Email" required error={errorOf('summary-email')}>
                <Input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    type="email"
                    autoComplete="email"
                />
            </Field>
            <Button type="submit" className="self-start">
                Send request
            </Button>
        </form>
    );
}

/**
 * After submitting, the summary takes the focus (WCAG 3.3.1); each message leads to its field. Field `id` sets the
 * id of the control the link points to
 */
export const AfterSubmit: Story = { render: () => <AfterSubmitDemo /> };
