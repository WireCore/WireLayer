import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Filter } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { Button } from '../Button/Button.js';
import { Switch } from '../Switch/Switch.js';
import { Popover } from './Popover.js';

function Demo() {
    const [open, setOpen] = useState(false);
    return (
        <View className="h-[320px] items-center justify-center">
            <Popover
                open={open}
                onOpenChange={setOpen}
                title="Filter"
                description="Only show servers with these properties."
                content={
                    <View className="gap-3">
                        <Switch defaultChecked>Online only</Switch>
                        <Switch>With warnings</Switch>
                        <Button size="sm" onPress={() => setOpen(false)}>
                            Apply
                        </Button>
                    </View>
                }
            >
                <Button variant="outline" size="sm" leadingIcon={Filter}>
                    Filter
                </Button>
            </Popover>
        </View>
    );
}

const meta = {
    title: 'Overlays/Popover',
    component: Popover,
    args: { title: 'Filter', content: null, children: <View /> },
    render: () => <Demo />,
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
