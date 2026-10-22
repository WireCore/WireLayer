import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { DatePicker } from '../DatePicker/DatePicker.js';
import { NativeSelect } from '../NativeSelect/NativeSelect.js';
import { NumberInput } from '../NumberInput/NumberInput.js';
import { Textarea } from '../Textarea/Textarea.js';
import { InlineEdit } from './InlineEdit.js';

const statuses = [
    { value: 'planning', label: 'Planning' },
    { value: 'in-progress', label: 'In progress' },
    { value: 'in-operation', label: 'In operation' },
];

function Name() {
    const [name, setName] = useState<string | undefined>('Customer portal');
    return (
        <div className="flex w-80 flex-col gap-2">
            <InlineEdit value={name} onValueChange={setName} label="Project name" className="text-lg font-semibold" />
            <p className="text-xs text-muted">Saved: {name}</p>
        </div>
    );
}

const meta = {
    title: 'Forms/InlineEdit',
    component: InlineEdit,
    args: { label: 'Project name' },
    render: () => <Name />,
} satisfies Meta<typeof InlineEdit>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Click (or Enter) edits, Enter saves, Escape cancels – the focus returns to the text */
export const Playground: Story = {};

/** The editor in a popover next to the value */
export const Popover: Story = {
    render: () => <InlineEdit defaultValue="Anna Berg" label="Owner" mode="popover" />,
};

const validate = async (value: string | undefined) => {
    await new Promise((done) => setTimeout(done, 600));
    if (!value || !/^[a-z0-9-]+$/.test(value)) return 'Lowercase letters, digits and hyphens only';
    if (value === 'intranet') return 'This address is already taken';
    return undefined;
};

/** An asynchronous check: the message keeps the editor open (and is announced) */
export const Validation: Story = {
    name: 'Validation',
    render: () => (
        <InlineEdit
            defaultValue="customer-portal"
            label="Address"
            validate={validate}
            format={(value) => `/${value}`}
        />
    ),
};

const euro = (value: number | null | undefined) =>
    value == null ? '' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(value);
const date = (value: string | null | undefined) =>
    value ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value)) : '';

/** Other editors through renderEditor: Textarea (Ctrl/⌘+Enter saves), select, number and date */
export const Editors: Story = {
    name: 'Editors',
    render: () => (
        <dl className="grid w-[460px] grid-cols-[max-content_1fr] items-center gap-x-6 gap-y-3 text-sm">
            <dt className="text-muted">Note</dt>
            <dd>
                <InlineEdit
                    defaultValue="Call back on Monday"
                    label="Note"
                    renderEditor={({ value, setValue, label }) => (
                        <Textarea
                            value={value ?? ''}
                            aria-label={label}
                            onChange={(event) => setValue(event.currentTarget.value)}
                        />
                    )}
                />
            </dd>
            <dt className="text-muted">Status</dt>
            <dd>
                <InlineEdit
                    defaultValue="in-progress"
                    label="Status"
                    format={(value) => statuses.find((entry) => entry.value === value)?.label ?? ''}
                    renderEditor={({ value, setValue, label }) => (
                        <NativeSelect
                            items={statuses}
                            value={value}
                            aria-label={label}
                            size="sm"
                            onValueChange={setValue}
                        />
                    )}
                />
            </dd>
            <dt className="text-muted">Budget</dt>
            <dd>
                <InlineEdit<number | null>
                    defaultValue={12000}
                    label="Budget"
                    format={euro}
                    renderEditor={({ value, setValue, label }) => (
                        <NumberInput value={value ?? null} aria-label={label} size="sm" onValueChange={setValue} />
                    )}
                />
            </dd>
            <dt className="text-muted">Due date</dt>
            <dd>
                <InlineEdit<string | null>
                    defaultValue="2026-11-30"
                    label="Due date"
                    format={date}
                    mode="popover"
                    renderEditor={({ value, setValue, label }) => (
                        <DatePicker value={value ?? null} aria-label={label} size="sm" onValueChange={setValue} />
                    )}
                />
            </dd>
        </dl>
    ),
};
