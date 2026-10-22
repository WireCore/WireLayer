import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Field } from '../Field/Field.js';
import { JsonInput, type JsonInputProps } from './JsonInput.js';

function Demo({ initial, ...args }: JsonInputProps & { initial: string }) {
    const [value, setValue] = useState(initial);
    return <JsonInput {...args} value={value} onValueChange={setValue} />;
}

const meta = {
    title: 'Forms/JsonInput',
    component: JsonInput,
    args: { indent: 2, formatButton: true, formatOnBlur: false, disabled: false },
    render: (args) => (
        <Field label="Configuration" helperText="JSON – checked as you type" className="w-[440px]">
            <Demo {...args} initial={'{"name":"web-01","tags":["prod","eu"],"replicas":3}'} />
        </Field>
    ),
} satisfies Meta<typeof JsonInput>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Checked while typing; the result is the field's description; "Format" pretty-prints */
export const Playground: Story = {};

/** An error with its position */
export const Invalid: Story = {
    name: 'Invalid',
    render: () => (
        <Field label="Configuration" className="w-[440px]">
            <Demo initial={'{\n  "name": "web-01",\n  "tags": ["prod",]\n}'} />
        </Field>
    ),
};
