import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Field } from '../Field/Field.js';
import { CascadeSelect, type CascadeOption, type CascadeSelectProps } from './CascadeSelect.js';

const locations: CascadeOption[] = [
    {
        value: 'de',
        label: 'Germany',
        children: [
            {
                value: 'by',
                label: 'Bavaria',
                children: [
                    { value: 'muc', label: 'Munich' },
                    { value: 'nue', label: 'Nuremberg' },
                ],
            },
            {
                value: 'he',
                label: 'Hesse',
                children: [
                    { value: 'fra', label: 'Frankfurt' },
                    { value: 'wie', label: 'Wiesbaden', disabled: true },
                ],
            },
        ],
    },
    {
        value: 'at',
        label: 'Austria',
        children: [
            { value: 'vie', label: 'Vienna' },
            { value: 'grz', label: 'Graz' },
        ],
    },
];

function Demo(args: CascadeSelectProps) {
    const [value, setValue] = useState<string | null>(null);
    return (
        <div className="flex w-72 flex-col gap-3">
            <Field label="Location">
                <CascadeSelect {...args} value={value} onValueChange={setValue} />
            </Field>
            <span className="text-xs text-muted">Value: {value ?? '–'}</span>
        </div>
    );
}

function PreselectedDemo(args: CascadeSelectProps) {
    const [value, setValue] = useState<string | null>('fra');
    return (
        <div className="flex w-72 flex-col gap-3">
            <Field label="Location">
                <CascadeSelect {...args} value={value} onValueChange={setValue} />
            </Field>
            <span className="text-xs text-muted">Value: {value ?? '–'}</span>
        </div>
    );
}

const meta = {
    title: 'Forms/CascadeSelect',
    component: CascadeSelect,
    args: { items: locations, disabled: false, invalid: false },
    argTypes: { items: { control: false } },
    render: (args) => <Demo {...(args as CascadeSelectProps)} />,
} satisfies Meta<typeof CascadeSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Preselected: Story = { render: (args) => <PreselectedDemo {...(args as CascadeSelectProps)} /> };

function FieldDemo(props: Partial<CascadeSelectProps>) {
    const [value, setValue] = useState<string | null>(null);
    return (
        <div className="flex w-80 flex-col gap-3">
            <Field label="Location">
                <CascadeSelect items={locations} {...props} value={value} onValueChange={setValue} />
            </Field>
            <span className="text-xs text-muted">Value: {value ?? '–'}</span>
        </div>
    );
}

/** The field is a search field: the hits are listed with their whole path; the button at the end opens the levels */
export const Search: Story = { name: 'Search', render: () => <FieldDemo filter clearable /> };

/** The levels in between can be chosen, too ("Choose Bavaria") */
export const ChangeOnSelect: Story = { name: 'Selectable levels', render: () => <FieldDemo changeOnSelect /> };

/** Levels open on click and with the arrow keys only, not on hover */
export const ClickToOpen: Story = { name: 'Open on click', render: () => <FieldDemo expandTrigger="click" /> };

const countries: CascadeOption[] = [
    { value: 'ch', label: 'Switzerland', hasChildren: true },
    { value: 'nl', label: 'Netherlands', hasChildren: true },
];
async function loadCities(option: CascadeOption): Promise<CascadeOption[]> {
    await new Promise((done) => setTimeout(done, 700));
    const cities: Record<string, string[]> = { ch: ['Zurich', 'Bern'], nl: ['Amsterdam', 'Utrecht'] };
    return (cities[option.value] ?? []).map((city) => ({ value: city.toLowerCase(), label: city }));
}

/** The cities of a country load when its level opens */
export const LazyChildren: Story = {
    name: 'Lazy-loaded children',
    render: () => (
        <div className="w-72">
            <Field label="Location">
                <CascadeSelect items={countries} loadChildren={loadCities} />
            </Field>
        </div>
    ),
};

interface Team {
    id: number;
    name: string;
}
const teams: CascadeOption<Team>[] = [
    {
        value: { id: 1, name: 'Sales' },
        label: 'Sales',
        children: [
            { value: { id: 11, name: 'Inside sales' }, label: 'Inside sales' },
            { value: { id: 12, name: 'Field sales' }, label: 'Field sales' },
        ],
    },
];

function ObjectDemo() {
    const [value, setValue] = useState<Team | null>({ id: 12, name: 'Field sales' });
    return (
        <div className="flex w-72 flex-col gap-3">
            <Field label="Team">
                <CascadeSelect items={teams} valueKey="id" clearable value={value} onValueChange={setValue} />
            </Field>
            <span className="text-xs text-muted">Value: {value ? JSON.stringify(value) : '–'}</span>
        </div>
    );
}

/** Objects as values, compared by their id (valueKey) */
export const ObjectValues: Story = { name: 'Objects as values', render: () => <ObjectDemo /> };

/** Heights of 32, 40 and 48 px; a spinner while the field waits for data */
export const SizesLoading: Story = {
    name: 'Sizes and loading',
    render: () => (
        <div className="flex w-72 flex-col gap-3">
            <CascadeSelect items={locations} size="sm" aria-label="Small" defaultValue="muc" clearable />
            <CascadeSelect items={locations} aria-label="Medium" defaultValue="muc" />
            <CascadeSelect items={locations} size="lg" aria-label="Large" loading />
        </div>
    ),
};
