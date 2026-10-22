import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import type { PeriodRange } from '@wirecore/wirelayer-recipes/native';
import { useState } from 'react';
import { View } from 'react-native';
import { Field } from '../Field/Field.js';
import { QuarterPicker } from '../QuarterPicker/QuarterPicker.js';
import { Text } from '../Text/Text.js';
import { YearPicker } from '../YearPicker/YearPicker.js';
import { MonthPicker } from './MonthPicker.js';

function Demo() {
    const [month, setMonth] = useState<string | null>('2026-10');
    const [quarter, setQuarter] = useState<string | null>('2026-Q4');
    const [years, setYears] = useState<PeriodRange>({ start: '2024', end: '2026' });
    return (
        <View className="w-80 gap-4">
            <Field label="Billing month">
                <MonthPicker value={month} onValueChange={setMonth} clearable presets={['thisMonth', 'lastMonth']} />
            </Field>
            <Field label="Quarter">
                <QuarterPicker value={quarter} onValueChange={setQuarter} max="2027-Q4" />
            </Field>
            <Field label="Years" helperText="Range">
                <YearPicker range value={years} onValueChange={setYears} presets={['last3Years', 'last5Years']} />
            </Field>
            <Text variant="muted">
                {month ?? '–'} · {quarter ?? '–'} · {years.start ?? '–'}–{years.end ?? '–'}
            </Text>
        </View>
    );
}

const meta = {
    title: 'Forms/MonthPicker',
    component: MonthPicker,
    render: () => <Demo />,
} satisfies Meta<typeof MonthPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

/** MonthPicker, QuarterPicker and YearPicker (range) */
export const Playground: Story = {};
