import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { SearchField, type SearchFieldProps } from './SearchField.js';

function Search(args: SearchFieldProps) {
    const [searched, setSearched] = useState('');
    const [scope, setScope] = useState(args.scope);
    return (
        <div className="flex w-[min(480px,90vw)] flex-col gap-2">
            <SearchField
                {...args}
                scope={scope}
                onScopeChange={setScope}
                onSubmit={(value, area) => setSearched(area ? `${value} in ${area}` : value)}
            />
            <p className="text-xs text-muted" aria-live="polite">
                {searched ? `Searched: ${searched}` : ''}
            </p>
        </div>
    );
}

const meta = {
    title: 'Forms/SearchField',
    component: SearchField,
    render: (args) => <Search {...args} />,
} satisfies Meta<typeof SearchField>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A search landmark: Enter searches, Escape empties, the button clears */
export const Playground: Story = {};

/** With a select for the area */
export const WithScope: Story = {
    name: 'With scope',
    args: {
        label: 'Search customers',
        scope: 'all',
        scopes: [
            { value: 'all', label: 'All fields' },
            { value: 'name', label: 'Name' },
            { value: 'number', label: 'Customer number' },
        ],
    },
};

/** Suggestions while typing (combobox pattern) */
export const Suggestions: Story = {
    name: 'Suggestions',
    args: { suggestions: ['web-01', 'web-02', 'db-primary', 'backup-02', 'cache-01'] },
};

/** Search running */
export const Loading: Story = { name: 'Loading', args: { loading: true, defaultValue: 'web' } };
