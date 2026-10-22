import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Field } from '../Field/Field.js';
import { Textarea, type TextareaProps } from './Textarea.js';

function Demo(args: TextareaProps) {
    const [text, setText] = useState('We are planning a customer portal.');
    return (
        <Field label="Message" helperText="The field grows with the text" className="w-80">
            <Textarea {...args} value={text} onChange={(event) => setText(event.target.value)} rows={2} />
        </Field>
    );
}

const meta = {
    title: 'Forms/Textarea',
    component: Textarea,
    args: { autoResize: true, disabled: false, invalid: false },
    render: (args) => <Demo {...args} />,
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AutoResize: Story = {};

function CounterDemo() {
    const [text, setText] = useState('Short description of the project');
    return (
        <Field label="Short description" className="w-80">
            <Textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                maxLength={120}
                showCount
                clearable
                rows={3}
            />
        </Field>
    );
}

/** Counter for maxlength – the remaining characters are announced once typing pauses */
export const Counter: Story = { render: () => <CounterDemo /> };

function RowsDemo() {
    const [text, setText] = useState('Line 1\nLine 2');
    return (
        <Field label="Note" className="w-80">
            <Textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                autoResize
                minRows={2}
                maxRows={5}
            />
        </Field>
    );
}

/** Grows between 2 and 5 rows, then it scrolls */
export const Rows: Story = { render: () => <RowsDemo /> };

/** Without v-model: start value and counter */
export const InitialValue: Story = {
    name: 'Initial value',
    render: () => (
        <Field label="Comment" className="w-80">
            <Textarea defaultValue="First draft" maxLength={80} showCount rows={2} />
        </Field>
    ),
};

export const SizesAndStates: Story = {
    render: () => (
        <div className="flex w-80 flex-col gap-3.5">
            <Field label="Small">
                <Textarea size="sm" rows={2} />
            </Field>
            <Field label="Large">
                <Textarea size="lg" rows={2} />
            </Field>
            <Field label="Validated" success="Looks good.">
                <Textarea rows={2} />
            </Field>
            <Field label="Saving">
                <Textarea loading rows={2} />
            </Field>
        </div>
    ),
};
