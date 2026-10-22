import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { Field } from '../Field/Field.js';
import { Text } from '../Text/Text.js';
import { DateRangePicker, type DateRange } from './DateRangePicker.js';

function Demo() {
    const [range, setRange] = useState<DateRange | null>({ start: '2026-10-19', end: '2026-10-23' });
    return (
        <View className="w-80 gap-3">
            <Field label="Vacation" helperText="Pick the start first, then the end">
                <DateRangePicker
                    value={range}
                    onValueChange={setRange}
                    presets={['thisWeek', 'last7Days', 'thisMonth', 'lastMonth']}
                    clearable
                />
            </Field>
            <Text variant="muted">
                Range: {range?.start ?? '–'} to {range?.end ?? '–'}
            </Text>
        </View>
    );
}

const meta = {
    title: 'Forms/DateRangePicker',
    component: DateRangePicker,
    render: () => <Demo />,
} satisfies Meta<typeof DateRangePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
