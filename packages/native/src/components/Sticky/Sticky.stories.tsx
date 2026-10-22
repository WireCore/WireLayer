import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { ScrollView, View } from 'react-native';
import { Button } from '../Button/Button.js';
import { Text } from '../Text/Text.js';
import { Sticky } from './Sticky.js';

const meta = {
    title: 'Layout/Sticky',
    component: Sticky,
    args: { edge: 'bottom', bar: true },
    render: (args) => (
        <View className="h-[320px] w-[340px] overflow-hidden rounded-xl border border-line">
            <ScrollView
                role="region"
                aria-label="Details"
                {...({ tabIndex: 0 } as object)}
                contentContainerClassName="gap-3 p-4"
            >
                {Array.from({ length: 12 }, (_, index) => (
                    <Text key={index} variant="muted">{`Details, section ${index + 1}`}</Text>
                ))}
            </ScrollView>
            <Sticky {...args}>
                <Button size="sm" variant="outline">
                    Save draft
                </Button>
                <Button size="sm">Submit</Button>
            </Sticky>
        </View>
    ),
} satisfies Meta<typeof Sticky>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
