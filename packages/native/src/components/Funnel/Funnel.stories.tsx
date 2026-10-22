import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { Funnel } from './Funnel.js';

const meta = {
    title: 'Data/Funnel',
    component: Funnel,
    args: {
        title: 'Orders in October',
        stages: [
            { label: 'Visits', value: 18400 },
            { label: 'Product page', value: 7350 },
            { label: 'Cart', value: 2100 },
            { label: 'Checkout', value: 1240 },
            { label: 'Ordered', value: 860 },
        ],
        conversion: true,
        table: true,
        tone: 'primary',
    },
    argTypes: {
        stages: { control: false },
        tone: { control: 'inline-radio', options: ['primary', 'info', 'success', 'warn', 'danger'] },
    },
    decorators: [(Story) => <View className="w-[360px]">{Story()}</View>],
} satisfies Meta<typeof Funnel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Stages narrowing with the value, the conversion between them; the data list is the text alternative */
export const Playground: Story = {};

export const WithoutConversion: Story = { name: 'Without conversion', args: { conversion: false, tone: 'info' } };
