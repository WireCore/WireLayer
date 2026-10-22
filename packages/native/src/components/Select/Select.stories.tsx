import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Cloud, CodeXml, Cpu, Server } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { Field } from '../Field/Field.js';
import type { DataSource } from '@wirecore/wirelayer-recipes/native';
import { Text } from '../Text/Text.js';
import { Select } from './Select.js';

const items = [
    { value: 'web', label: 'Software & Web', icon: CodeXml },
    { value: 'hosting', label: 'Managed Hosting', icon: Server },
    { value: 'cloud', label: 'Cloud & DevOps', icon: Cloud },
    { value: 'hardware', label: 'Hardware', icon: Cpu, disabled: true },
];

function Demo() {
    const [value, setValue] = useState<string | null>('hosting');
    return (
        <View className="w-80 gap-3">
            <Field label="Service" helperText="What are you interested in?">
                <Select items={items} value={value} onValueChange={setValue} />
            </Field>
            <Text variant="muted">Value: {value ?? '–'}</Text>
        </View>
    );
}

const meta = {
    title: 'Forms/Select',
    component: Select,
    args: { items },
    render: () => <Demo />,
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

interface Server {
    id: number;
    name: string;
    region: string;
}

const servers: Server[] = [
    { id: 1, name: 'web-01', region: 'Frankfurt' },
    { id: 2, name: 'web-02', region: 'Frankfurt' },
    { id: 3, name: 'db-01', region: 'Berlin' },
    { id: 4, name: 'db-02', region: 'Berlin' },
    { id: 5, name: 'cache-01', region: 'Vienna' },
];

function ObjectsDemo() {
    const [value, setValue] = useState<Server | null>(servers[2]!);
    return (
        <View className="w-80 gap-3">
            <Field label="Server" helperText="Objects as values, grouped by region">
                <Select
                    items={servers}
                    itemValue={(server) => server}
                    itemLabel="name"
                    itemGroup="region"
                    valueKey="id"
                    value={value}
                    onValueChange={setValue}
                    filter
                    clearable
                />
            </Field>
            <Text variant="muted">Value: {value ? `${value.name} (${value.id})` : '–'}</Text>
        </View>
    );
}

/** Any values (objects with valueKey), groups, search field in the sheet and a clear button */
export const Objects: Story = {
    render: () => <ObjectsDemo />,
};

export const Sizes: Story = {
    render: () => (
        <View className="w-80 gap-3">
            <Select items={items} aria-label="Small" size="sm" defaultValue="web" />
            <Select items={items} aria-label="Medium" defaultValue="web" />
            <Select items={items} aria-label="Large" size="lg" defaultValue="web" loading />
        </View>
    ),
};

// 500 cities from a "server": pages of 50, the search filters there
const cities = Array.from({ length: 500 }, (_, index) => ({
    value: `city-${index + 1}`,
    label: `City ${index + 1}`,
}));
const citySource: DataSource<{ value: string; label: string }> = {
    getItems: async ({ search, page = 1, pageSize = 50, signal }) => {
        await new Promise((done, fail) => {
            const timer = setTimeout(done, 300);
            signal.addEventListener('abort', () => {
                clearTimeout(timer);
                fail(signal.reason);
            });
        });
        const found = cities.filter((city) => !search || city.label.toLowerCase().includes(search.toLowerCase()));
        return { items: found.slice((page - 1) * pageSize, page * pageSize), totalCount: found.length };
    },
    getItemsByKeys: async (keys) => cities.filter((city) => keys.includes(city.value)),
};

function ServerDemo() {
    const [value, setValue] = useState<string | null>('city-120');
    return (
        <View className="w-80 gap-3">
            <Field label="City" helperText="500 entries from the server, 50 per page">
                <Select dataSource={citySource} items={[]} value={value} onValueChange={setValue} filter />
            </Field>
            <Text variant="muted">Value: {value ?? '–'}</Text>
        </View>
    );
}

/** dataSource: the first page when the sheet opens, the next at the end of the list, the search asks the server */
export const ServerData: Story = {
    render: () => <ServerDemo />,
};
