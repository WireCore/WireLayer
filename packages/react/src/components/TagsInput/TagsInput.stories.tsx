import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Field } from '../Field/Field.js';
import { TagsInput, type TagsInputProps } from './TagsInput.js';

function Demo(args: TagsInputProps) {
    const [tags, setTags] = useState(['hosting', 'frankfurt']);
    return (
        <div className="flex w-96 flex-col gap-3">
            <Field label="Keywords" helperText="Enter or comma adds">
                <TagsInput {...args} value={tags} onValueChange={setTags} />
            </Field>
            <span className="text-xs text-muted">Value: {tags.join(', ') || '–'}</span>
        </div>
    );
}

const isEmail = (value: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);

const meta = {
    title: 'Forms/TagsInput',
    component: TagsInput,
    args: { placeholder: 'Add keyword', max: 8, disabled: false, invalid: false },
    render: (args) => <Demo {...args} />,
} satisfies Meta<typeof TagsInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Emails: Story = {
    render: () => (
        <Field label="Recipients" helperText="Valid email addresses only" className="w-96">
            <TagsInput validate={isEmail} placeholder="name@company.com" />
        </Field>
    ),
};

const technologies = ['linux', 'docker', 'kubernetes', 'postgresql', 'nginx', 'redis', 'grafana', 'ansible'];

function SuggestionsDemo() {
    const [tags, setTags] = useState(['linux']);
    return (
        <div className="flex w-96 flex-col gap-3">
            <Field label="Technologies" helperText="Pick a suggestion or type freely">
                <TagsInput value={tags} onValueChange={setTags} suggestions={technologies} placeholder="Technology" />
            </Field>
            <span className="text-xs text-muted">Value: {tags.join(', ') || '–'}</span>
        </div>
    );
}

/** `suggestions`: shown while typing (already added ones are left out); Arrow down opens them, Enter adds */
export const Suggestions: Story = {
    name: 'With suggestions',
    render: () => <SuggestionsDemo />,
};
