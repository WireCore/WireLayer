import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { Progress } from './Progress.js';

const meta = {
    title: 'Feedback/Progress',
    component: Progress,
    args: { value: 68, label: 'Build', showValue: true },
    argTypes: { value: { control: { type: 'range', min: 0, max: 100 } } },
    decorators: [(Story) => <View className="w-[320px]">{Story()}</View>],
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Segments with a legend, steps, stripes and vertical */
export const Variants: Story = {
    name: 'Variants',
    render: () => (
        <View className="gap-6">
            <Progress
                value={0}
                label="Storage"
                segments={[
                    { value: 38, label: 'Databases' },
                    { value: 21, label: 'Files' },
                    { value: 9, label: 'Backups', color: 'muted' },
                ]}
            />
            <Progress value={3} max={5} steps={5} label="Setup" valueText={() => 'Step 3 of 5'} />
            <Progress value={45} label="Upload" striped animated />
            <View className="flex-row gap-6">
                <Progress value={70} label="CPU" orientation="vertical" className="w-16" />
                <Progress value={35} label="RAM" orientation="vertical" className="w-16" />
            </View>
        </View>
    ),
};

/** Compact bars for lists: `size="xs"`, `hideLabel`, `barText` in the bar and `status` for the colour */
export const Compact: Story = {
    name: 'Compact',
    render: () => (
        <View className="gap-3">
            <Progress value={42} label="backup.tar.gz" hideLabel showValue={false} barText="42 %" />
            <Progress value={0} label="logs.zip" hideLabel showValue={false} barText="waiting" />
            <Progress value={77} label="db.dump" hideLabel showValue={false} barText="failed" status="danger" />
            <Progress value={81} label="Disk" size="xs" status="warn" />
        </View>
    ),
};
