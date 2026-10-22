import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { MiniCalendar } from './MiniCalendar.js';

const meta = {
    title: 'Forms/MiniCalendar',
    component: MiniCalendar,
    args: { defaultValue: '2026-10-21', startDate: '2026-10-19', label: 'Delivery day' },
    render: (args) => (
        <View className="w-[360px]">
            <MiniCalendar
                {...args}
                isDateUnavailable={(day) => [0, 6].includes(new Date(`${day}T12:00:00Z`).getUTCDay())}
            />
        </View>
    ),
} satisfies Meta<typeof MiniCalendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
