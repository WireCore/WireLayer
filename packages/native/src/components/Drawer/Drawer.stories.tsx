import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Hexagon, Menu as MenuIcon, SlidersHorizontal } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { Button } from '../Button/Button.js';
import { ChipGroup } from '../ChipGroup/ChipGroup.js';
import { Text } from '../Text/Text.js';
import { Icon } from '../../utils/Icon.js';
import { Drawer } from './Drawer.js';

const locations = [
    { value: 'fra', label: 'Frankfurt' },
    { value: 'nue', label: 'Nuremberg' },
    { value: 'vie', label: 'Vienna' },
];

function Demo() {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState<string[]>([]);
    return (
        <View className="gap-3">
            <Button variant="outline" leadingIcon={SlidersHorizontal} onPress={() => setOpen(true)}>
                Filter
            </Button>
            <Text variant="muted">Locations: {value.join(', ') || 'all'}</Text>
            <Drawer
                open={open}
                onOpenChange={setOpen}
                title="Filter"
                description="Narrow down servers by location"
                footer={<Button onPress={() => setOpen(false)}>Apply</Button>}
            >
                <View className="px-3 pt-3 pb-4">
                    <ChipGroup items={locations} value={value} onValueChange={setValue} label="Locations" />
                </View>
            </Drawer>
        </View>
    );
}

const meta = {
    title: 'Overlays/Drawer',
    component: Drawer,
    args: { open: false, onOpenChange: () => {}, title: 'Filter' },
    render: () => <Demo />,
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

function PlacementDemo() {
    const [open, setOpen] = useState<'left' | 'right' | 'top' | 'bottom' | null>(null);
    return (
        <View className="flex-row flex-wrap gap-2">
            {(['left', 'right', 'top', 'bottom'] as const).map((placement) => (
                <Button key={placement} size="sm" variant="outline" onPress={() => setOpen(placement)}>
                    {{ left: 'Left', right: 'Right', top: 'Top', bottom: 'Bottom (large)' }[placement]}
                </Button>
            ))}
            {(['left', 'right', 'top', 'bottom'] as const).map((placement) => (
                <Drawer
                    key={placement}
                    open={open === placement}
                    onOpenChange={() => setOpen(null)}
                    placement={placement}
                    size={placement === 'bottom' ? 'lg' : 'sm'}
                    title="Project"
                    description="Details and settings"
                    footer={<Button onPress={() => setOpen(null)}>Done</Button>}
                >
                    <Text variant="muted">Customer portal · Managed hosting · Frankfurt</Text>
                </Drawer>
            ))}
        </View>
    );
}

/** From each edge: left/right for navigation and details, top for notices, bottom as a sheet with a height */
export const Placements: Story = { name: 'Sides and sizes', render: () => <PlacementDemo /> };

function LogoDemo() {
    const [open, setOpen] = useState(false);
    return (
        <View className="items-start">
            <Button variant="outline" leadingIcon={MenuIcon} onPress={() => setOpen(true)}>
                Menu
            </Button>
            <Drawer
                open={open}
                onOpenChange={setOpen}
                title="Menu"
                placement="left"
                size="sm"
                hideTitle
                header={
                    <View className="flex-row items-center gap-2">
                        <Icon icon={Hexagon} className="size-6 text-primary" />
                        <Text className="font-sans-semibold">Acme</Text>
                    </View>
                }
            >
                <Text>Dashboard</Text>
                <Text>Servers</Text>
                <Text>Invoices</Text>
            </Drawer>
        </View>
    );
}

/** Navigation from the left with the logo of the app next to the close button (`header`); the title names it */
export const LogoInHeader: Story = { render: () => <LogoDemo /> };
