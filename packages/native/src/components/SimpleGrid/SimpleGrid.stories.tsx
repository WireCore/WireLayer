import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { Box } from '../../../.storybook/Box.js';
import { SimpleGrid } from './SimpleGrid.js';

const meta = {
    title: 'Layout/SimpleGrid',
    component: SimpleGrid,
    args: { columns: 2, gap: 'sm' },
    render: (args) => (
        <View className="w-[340px]">
            <SimpleGrid {...args}>
                {['Frankfurt', 'Nuremberg', 'Vienna', 'Zurich', 'Hamburg'].map((city) => (
                    <Box key={city} label={city} />
                ))}
            </SimpleGrid>
        </View>
    ),
} satisfies Meta<typeof SimpleGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** As many columns as fit with at least 100 pt */
export const MinColumnWidth: Story = { name: 'Minimum width', args: { minColumnWidth: 100 } };
