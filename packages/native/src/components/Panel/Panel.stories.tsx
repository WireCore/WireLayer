import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Pencil } from 'lucide-react-native';
import { View } from 'react-native';
import { Button } from '../Button/Button.js';
import { IconButton } from '../IconButton/IconButton.js';
import { Text } from '../Text/Text.js';
import { Panel } from './Panel.js';

const meta = {
    title: 'Layout/Panel',
    component: Panel,
    args: {
        title: 'Billing address',
        toggleable: true,
        actions: <IconButton icon={Pencil} label="Edit billing address" variant="text" size="sm" />,
        footer: (
            <Button size="sm" variant="outline">
                Verify address
            </Button>
        ),
        children: <Text variant="muted">Northside Utilities · 12 Harbor Street · 20457 Hamburg</Text>,
    },
    decorators: [(Story) => <View className="w-[340px]">{Story()}</View>],
} satisfies Meta<typeof Panel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
