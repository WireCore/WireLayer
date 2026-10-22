import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { Truncate } from './Truncate.js';

const text =
    'We run your applications in two German data centers, back them up daily and monitor them around the clock. If something goes wrong, we get in touch before your customers notice anything.';

const meta = {
    title: 'Data/Truncate',
    component: Truncate,
    args: { text, lines: 2, expandable: true },
    decorators: [(Story) => <View className="w-[300px]">{Story()}</View>],
} satisfies Meta<typeof Truncate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** One line; the full text on a long press or hover */
export const Tooltip: Story = { args: { lines: 1, expandable: false } };
