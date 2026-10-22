import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { ArrowDownUp, Copy, Ellipsis, Eye, FolderInput, Pencil, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { Button } from '../Button/Button.js';
import { IconButton } from '../IconButton/IconButton.js';
import { Text } from '../Text/Text.js';
import { Menu, type MenuEntry } from './Menu.js';

const items = [
    { value: 'edit', label: 'Edit', icon: Pencil },
    { value: 'duplicate', label: 'Duplicate', icon: Copy },
    { value: 'delete', label: 'Delete', icon: Trash2, danger: true },
];

function Demo() {
    const [chosen, setChosen] = useState('');
    return (
        <View className="flex-row items-center gap-3">
            <Menu items={items} onSelect={setChosen} title="web-01">
                <IconButton icon={Ellipsis} label="Actions for web-01" />
            </Menu>
            <Text variant="muted">{chosen ? `Selected: ${chosen}` : ''}</Text>
        </View>
    );
}

const meta = {
    title: 'Overlays/Menu',
    component: Menu,
    args: { items, children: <View /> },
    render: () => <Demo />,
} satisfies Meta<typeof Menu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

const viewEntries: MenuEntry[] = [
    {
        type: 'group',
        label: 'Columns',
        items: [
            { type: 'checkbox', value: 'status', label: 'Status', checked: true },
            { type: 'checkbox', value: 'owner', label: 'Owner', checked: true },
            { type: 'checkbox', value: 'updated', label: 'Modified' },
        ],
    },
    { type: 'separator' },
    {
        type: 'radio',
        name: 'sort',
        label: 'Sort order',
        value: 'name',
        items: [
            { value: 'name', label: 'Name' },
            { value: 'date', label: 'Date' },
        ],
    },
];

function ChoiceDemo() {
    const [state, setState] = useState('Columns: status, owner · Sort order: name');
    const [columns, setColumns] = useState(['status', 'owner']);
    const [sort, setSort] = useState('name');
    const show = (nextColumns: string[], nextSort: string) =>
        setState(`Columns: ${nextColumns.join(', ')} · Sort order: ${nextSort}`);
    return (
        <View className="items-start gap-3">
            <Menu
                items={viewEntries}
                title="View"
                onCheckedChange={(value, checked) => {
                    const next = checked ? [...columns, value] : columns.filter((entry) => entry !== value);
                    setColumns(next);
                    show(next, sort);
                }}
                onValueChange={(_, value) => {
                    setSort(value);
                    show(columns, value);
                }}
            >
                <Button variant="outline" size="sm" leadingIcon={Eye}>
                    View
                </Button>
            </Menu>
            <Text variant="muted">{state}</Text>
        </View>
    );
}

/** Checkbox items in a group, a radio group for the sort order – the sheet stays open while choosing */
export const CheckboxAndRadio: Story = { name: 'Checkbox and radio', render: () => <ChoiceDemo /> };

const nested: MenuEntry[] = [
    { value: 'rename', label: 'Rename', icon: Pencil },
    {
        value: 'move',
        label: 'Move to',
        icon: FolderInput,
        children: [
            { value: 'move-archive', label: 'Archive' },
            {
                value: 'move-team',
                label: 'Team',
                children: [
                    { value: 'move-sales', label: 'Sales' },
                    { value: 'move-support', label: 'Support' },
                ],
            },
        ],
    },
    { value: 'sort', label: 'Sort', icon: ArrowDownUp },
];

function SubmenuDemo() {
    const [chosen, setChosen] = useState('–');
    return (
        <View className="items-start gap-3">
            <Menu items={nested} title="Quote.pdf" onSelect={setChosen}>
                <Button variant="outline" size="sm">
                    File
                </Button>
            </Menu>
            <Text variant="muted">{`Selected: ${chosen}`}</Text>
        </View>
    );
}

/** Submenus open in the same sheet, "Back" goes up a level */
export const Submenus: Story = { name: 'Submenus', render: () => <SubmenuDemo /> };
