import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import type { SelectItem } from '../Select/Select.js';
import { Text } from '../Text/Text.js';
import { PickList, type PickListProps } from './PickList.js';

const permissions: SelectItem[] = [
    { value: 'read', label: 'Read' },
    { value: 'write', label: 'Write' },
    { value: 'delete', label: 'Delete' },
    { value: 'share', label: 'Share' },
    { value: 'export', label: 'Export' },
    { value: 'admin', label: 'Manage', disabled: true },
];

function Demo(args: PickListProps) {
    const [value, setValue] = useState(['read']);
    return (
        <View className="gap-3">
            <PickList {...args} value={value} onValueChange={setValue} />
            <Text variant="muted">Selected: {value.join(', ') || '–'}</Text>
        </View>
    );
}

const meta = {
    title: 'Data/PickList',
    component: PickList,
    args: {
        items: permissions,
        sourceLabel: 'Available permissions',
        targetLabel: 'Role permissions',
        filter: false,
        selectAll: false,
    },
    decorators: [(Story) => <View className="w-[340px]">{Story()}</View>],
    render: (args) => <Demo {...(args as PickListProps)} />,
} satisfies Meta<typeof PickList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Choose entries in one list and move them with the buttons between the lists */
export const Playground: Story = {};

/** A search field above each list and "Select all" */
export const WithFilter: Story = { name: 'With search and select all', args: { filter: true, selectAll: true } };

const firstNames = ['Anna', 'Ben', 'Clara', 'David', 'Eva'];
const lastNames = ['Albrecht', 'Brandt', 'Conrad', 'Dietz'];
const people: SelectItem[] = Array.from({ length: 40 }, (_, index) => ({
    value: `p${index + 1}`,
    label: `${firstNames[index % 5]} ${lastNames[index % 4]} ${index + 1}`,
}));

/** The source list from a "server": it is searched there, pages of 10 load at its end */
function ServerDemo() {
    const [query, setQuery] = useState('');
    const [shown, setShown] = useState<SelectItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [value, setValue] = useState<string[]>([]);
    const matches = people.filter((person) => person.label.toLowerCase().includes(query.trim().toLowerCase()));
    useEffect(() => {
        const timer = setTimeout(() => {
            setShown(matches.slice(0, 10));
            setLoading(false);
        }, 500);
        return () => clearTimeout(timer);
        // Only when the search changes – a new answer of the "server"
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query]);
    return (
        <View className="gap-3">
            <PickList
                items={shown}
                value={value}
                onValueChange={setValue}
                sourceLabel="People"
                targetLabel="Team"
                filter
                manualFilter
                onFilterChange={(text) => {
                    setLoading(true);
                    setQuery(text);
                }}
                loading={loading}
                hasMore={shown.length < matches.length}
                onLoadMore={() => {
                    setLoading(true);
                    setTimeout(() => {
                        setShown(matches.slice(0, shown.length + 10));
                        setLoading(false);
                    }, 500);
                }}
            />
            <Text variant="muted">Team: {value.length} people</Text>
        </View>
    );
}

/** Server search and paging in the source list (manualFilter, onFilterChange, loading, hasMore, onLoadMore) */
export const LoadMore: Story = { name: 'Loading more', render: () => <ServerDemo /> };
