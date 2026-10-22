import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { Slider } from './Slider.js';

const meta = {
    title: 'Forms/Slider',
    component: Slider,
    args: { label: 'Volume', defaultValue: [40], disabled: false },
    render: (args) => (
        <View className="w-80">
            <Slider {...args} />
        </View>
    ),
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Range: Story = {
    args: { label: 'Price', defaultValue: [20, 80], step: 5, formatValue: (value: number) => `€${value}` },
};

export const Marks: Story = {
    args: {
        label: 'Storage',
        defaultValue: [64],
        min: 0,
        max: 256,
        marks: [
            { value: 0, label: '0' },
            { value: 64, label: '64' },
            { value: 128, label: '128' },
            { value: 256, label: '256 GB' },
        ],
        restrictToMarks: true,
        formatValue: (value: number) => `${value} GB`,
    },
};

export const Vertical: Story = {
    render: () => (
        <View className="h-56 flex-row gap-8">
            <Slider label="Bass" orientation="vertical" defaultValue={[30]} className="h-full" />
            <Slider label="Treble" orientation="vertical" defaultValue={[70]} marks={[0, 50, 100]} className="h-full" />
        </View>
    ),
};
