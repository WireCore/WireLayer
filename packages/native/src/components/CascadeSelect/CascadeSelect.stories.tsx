import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useRef, useState } from 'react';
import { View } from 'react-native';
import { Field } from '../Field/Field.js';
import { Text } from '../Text/Text.js';
import { CascadeSelect, type CascadeOption } from './CascadeSelect.js';

const items: CascadeOption[] = [
    {
        value: 'de',
        label: 'Germany',
        children: [
            {
                value: 'by',
                label: 'Bavaria',
                children: [
                    { value: 'munich', label: 'Munich' },
                    { value: 'nuremberg', label: 'Nuremberg' },
                    { value: 'augsburg', label: 'Augsburg' },
                ],
            },
            {
                value: 'nw',
                label: 'North Rhine-Westphalia',
                children: [
                    { value: 'cologne', label: 'Cologne' },
                    { value: 'dusseldorf', label: 'Dusseldorf' },
                ],
            },
            { value: 'be', label: 'Berlin' },
        ],
    },
    {
        value: 'at',
        label: 'Austria',
        children: [
            { value: 'vienna', label: 'Vienna' },
            { value: 'tyrol', label: 'Tyrol', children: [{ value: 'innsbruck', label: 'Innsbruck' }] },
        ],
    },
    { value: 'ch', label: 'Switzerland', children: [{ value: 'zurich', label: 'Zurich', disabled: true }] },
];

function Demo({ changeOnSelect = false, filter = false }: { changeOnSelect?: boolean; filter?: boolean }) {
    const [value, setValue] = useState<string | null>('nuremberg');
    return (
        <View className="gap-3">
            <Field label="Location" helperText="Country, state and city">
                <CascadeSelect
                    items={items}
                    value={value}
                    onValueChange={setValue}
                    changeOnSelect={changeOnSelect}
                    filter={filter}
                    clearable
                />
            </Field>
            <Text variant="muted">Value: {value ?? '–'}</Text>
        </View>
    );
}

const meta = {
    title: 'Forms/CascadeSelect',
    component: CascadeSelect,
    args: { items },
    decorators: [(Story) => <View className="w-80">{Story()}</View>],
    render: () => <Demo />,
} satisfies Meta<typeof CascadeSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Every level can be chosen: the first entry of a level is "Choose <level>" */
export const ChangeOnSelect: Story = { name: 'Every level selectable', render: () => <Demo changeOnSelect /> };

/** Search field in the sheet: hits with their whole path ("bav mun" finds Germany › Bavaria › Munich) */
export const Search: Story = { name: 'Search', render: () => <Demo filter /> };

const countries: CascadeOption[] = [
    { value: 'de', label: 'Germany', hasChildren: true },
    { value: 'at', label: 'Austria', hasChildren: true },
];

const optionsOf = (option: CascadeOption): CascadeOption[] => {
    if (option.value === 'de')
        return [
            { value: 'de-north', label: 'Northern Germany', hasChildren: true },
            { value: 'de-south', label: 'Southern Germany', hasChildren: true },
        ];
    if (option.value === 'at')
        return [
            { value: 'at-east', label: 'Eastern Austria', hasChildren: true },
            { value: 'at-west', label: 'Western Austria', hasChildren: true },
        ];
    return [
        { value: `${option.value}-1`, label: `${option.label}: Branch 1` },
        { value: `${option.value}-2`, label: `${option.label}: Branch 2` },
    ];
};

function LazyDemo() {
    const [value, setValue] = useState<string | null>(null);
    // "Austria" fails the first time – the retry row loads it again
    const failedOnce = useRef(false);
    const loadChildren = (option: CascadeOption, { signal }: { signal: AbortSignal }) =>
        new Promise<CascadeOption[]>((resolve, reject) => {
            const timer = setTimeout(() => {
                if (option.value === 'at' && !failedOnce.current) {
                    failedOnce.current = true;
                    reject(new Error('Network error'));
                    return;
                }
                resolve(optionsOf(option));
            }, 800);
            signal.addEventListener('abort', () => {
                clearTimeout(timer);
                reject(Object.assign(new Error('Aborted'), { name: 'AbortError' }));
            });
        });
    return (
        <View className="gap-3">
            <Field label="Branch">
                <CascadeSelect items={countries} value={value} onValueChange={setValue} loadChildren={loadChildren} />
            </Field>
            <Text variant="muted">Value: {value ?? '–'}</Text>
        </View>
    );
}

/** The options of each level load when it opens (0.8 s); "Austria" fails the first time – "try again" */
export const LazyLoading: Story = { name: 'Lazy loading', render: () => <LazyDemo /> };

interface Region {
    id: number;
    name: string;
}

function ObjectsDemo() {
    const [value, setValue] = useState<Region | null>({ id: 12, name: 'Vienna' });
    const regions: CascadeOption<Region>[] = [
        {
            value: { id: 1, name: 'Austria' },
            label: 'Austria',
            children: [
                { value: { id: 12, name: 'Vienna' }, label: 'Vienna' },
                { value: { id: 13, name: 'Graz' }, label: 'Graz' },
            ],
        },
    ];
    return (
        <View className="gap-3">
            <CascadeSelect
                items={regions}
                value={value}
                onValueChange={setValue}
                valueKey="id"
                aria-label="Region"
                separator=" / "
            />
            <Text variant="muted">Value: {value ? `${value.name} (${value.id})` : '–'}</Text>
        </View>
    );
}

/** Objects as values (valueKey), an own separator, without a Field */
export const Objects: Story = { name: 'Objects as values', render: () => <ObjectsDemo /> };

/** Invalid, disabled and loading fields */
export const States: Story = {
    name: 'States',
    render: () => (
        <View className="gap-4">
            <Field label="Location" error="Choose a location" invalid>
                <CascadeSelect items={items} />
            </Field>
            <Field label="Location (locked)" disabled>
                <CascadeSelect items={items} defaultValue="vienna" />
            </Field>
            <CascadeSelect items={items} aria-label="Location (loading)" loading size="sm" />
        </View>
    ),
};
