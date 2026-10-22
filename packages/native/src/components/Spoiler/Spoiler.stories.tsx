import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { Text } from '../Text/Text.js';
import { Spoiler } from './Spoiler.js';

const meta = {
    title: 'Layout/Spoiler',
    component: Spoiler,
    args: {
        maxHeight: 72,
        children: (
            <Text variant="muted">
                Our data centers in Frankfurt and Nuremberg are ISO 27001 certified. All data stays in Germany. Backups
                run daily and are kept for 30 days. On request, we mirror your systems between both sites, so an outage
                at one site goes unnoticed.
            </Text>
        ),
    },
    decorators: [(Story) => <View className="w-[300px]">{Story()}</View>],
} satisfies Meta<typeof Spoiler>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
