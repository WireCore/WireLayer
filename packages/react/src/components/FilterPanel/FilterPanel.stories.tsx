import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Field } from '../Field/Field.js';
import { NativeSelect } from '../NativeSelect/NativeSelect.js';
import { NumberInput } from '../NumberInput/NumberInput.js';
import { FilterChips, FilterPanel, type FilterChip, type FilterPanelProps } from './FilterPanel.js';

const locations = [
    { value: 'Frankfurt', label: 'Frankfurt' },
    { value: 'Nuremberg', label: 'Nuremberg' },
    { value: 'Vienna', label: 'Vienna' },
];
const statuses = [
    { value: 'online', label: 'Online' },
    { value: 'maintenance', label: 'Maintenance' },
];

function Servers(args: FilterPanelProps) {
    const [location, setLocation] = useState('Frankfurt');
    const [status, setStatus] = useState('');
    const [minLoad, setMinLoad] = useState<number | null>(50);
    const filters = [
        location && { id: 'location', label: 'Location', value: location },
        status && { id: 'status', label: 'Status', value: statuses.find((entry) => entry.value === status)!.label },
        minLoad !== null && { id: 'load', label: 'Load', value: `from ${minLoad}%` },
    ].filter(Boolean) as FilterChip[];
    const remove = (id: string) => {
        if (id === 'location') setLocation('');
        if (id === 'status') setStatus('');
        if (id === 'load') setMinLoad(null);
    };
    return (
        <FilterPanel
            {...args}
            filters={filters}
            className="w-[min(900px,92vw)]"
            onRemove={remove}
            onClear={() => ['location', 'status', 'load'].forEach(remove)}
        >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Field label="Location">
                    <NativeSelect
                        value={location}
                        onValueChange={setLocation}
                        items={locations}
                        placeholder="All"
                        size="sm"
                    />
                </Field>
                <Field label="Status">
                    <NativeSelect
                        value={status}
                        onValueChange={setStatus}
                        items={statuses}
                        placeholder="All"
                        size="sm"
                    />
                </Field>
                <Field label="Minimum load (%)">
                    <NumberInput value={minLoad} onValueChange={setMinLoad} min={0} max={100} size="sm" />
                </Field>
            </div>
        </FilterPanel>
    );
}

const meta = {
    title: 'Forms/FilterPanel',
    component: FilterPanel,
    args: { display: 'inline' },
    argTypes: { display: { control: 'inline-radio', options: ['inline', 'drawer', 'auto'] } },
    render: (args) => <Servers {...args} />,
} satisfies Meta<typeof FilterPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The button shows the number of active filters and opens the form; chips remove single filters */
export const Playground: Story = {};

/** On small screens in a drawer (`display="auto"`), here always */
export const Drawer: Story = { args: { display: 'drawer' } };

function OnlyChips() {
    const [filters, setFilters] = useState([
        { id: 'location', label: 'Location', value: 'Frankfurt' },
        { id: 'load', label: 'Load', value: 'over 50%' },
        { id: 'os', label: 'System', value: 'Debian, Ubuntu' },
    ]);
    return (
        <FilterChips
            filters={filters}
            onRemove={(id) => setFilters(filters.filter((filter) => filter.id !== id))}
            onClear={() => setFilters([])}
        />
    );
}

/** Only the chips, e.g. above search results */
export const Chips: Story = { render: () => <OnlyChips /> };
