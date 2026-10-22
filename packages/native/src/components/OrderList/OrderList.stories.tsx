import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { Badge } from '../Badge/Badge.js';
import type { SelectItem } from '../Select/Select.js';
import { Text } from '../Text/Text.js';
import { OrderList, type OrderListProps } from './OrderList.js';

const columns: SelectItem[] = [
    { value: 'name', label: 'Name' },
    { value: 'email', label: 'Email' },
    { value: 'team', label: 'Team' },
    { value: 'role', label: 'Role' },
    { value: 'created', label: 'Created on', disabled: true },
];

function Demo(args: OrderListProps) {
    const [items, setItems] = useState(columns);
    return (
        <View className="gap-3">
            <OrderList {...args} value={items} onValueChange={setItems} />
            <Text variant="muted">{items.map((item) => item.label).join(' → ')}</Text>
        </View>
    );
}

const meta = {
    title: 'Data/OrderList',
    component: OrderList,
    args: { label: 'Table columns', filter: false },
    decorators: [(Story) => <View className="w-[340px]">{Story()}</View>],
    render: (args) => <Demo {...(args as OrderListProps)} />,
} satisfies Meta<typeof OrderList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Choose an entry, then move it with the buttons – or with the screen reader actions of the entry */
export const Playground: Story = {};

/** A search field above the list; moving works on the whole list */
export const WithFilter: Story = { name: 'With search', args: { filter: true } };

interface Step {
    id: number;
    title: string;
    owner: string;
}

function StepsDemo() {
    const [steps, setSteps] = useState<Step[]>([
        { id: 1, title: 'Review quote', owner: 'Sales' },
        { id: 2, title: 'Sign contract', owner: 'Legal' },
        { id: 3, title: 'Create account', owner: 'IT' },
    ]);
    return (
        <OrderList<Step, number>
            label="Onboarding steps"
            value={steps}
            onValueChange={setSteps}
            itemValue="id"
            itemLabel="title"
            renderItem={(step) => (
                <View className="flex-1 flex-row items-center justify-between gap-2">
                    <Text>{step.title}</Text>
                    <Badge variant="soft">{step.owner}</Badge>
                </View>
            )}
        />
    );
}

/** Own objects with itemValue/itemLabel and a custom row */
export const CustomItems: Story = { name: 'Custom items', render: () => <StepsDemo /> };
