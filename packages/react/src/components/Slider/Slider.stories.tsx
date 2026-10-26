import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Slider, type SliderProps } from './Slider.js';

function Demo(args: SliderProps) {
    const [value, setValue] = useState([70]);
    return <Slider {...args} value={value} onValueChange={setValue} formatValue={(v) => `${v}%`} className="w-80" />;
}

function RangeDemo() {
    const [value, setValue] = useState([200, 800]);
    return (
        <Slider
            value={value}
            onValueChange={setValue}
            label="Price"
            min={0}
            max={1000}
            step={50}
            formatValue={(v) => `€${v}`}
            className="w-80"
        />
    );
}

const meta = {
    title: 'Forms/Slider',
    component: Slider,
    args: { label: 'Utilization limit', min: 0, max: 100, step: 5, disabled: false, showValue: true },
    render: (args) => <Demo {...args} />,
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Two thumbs, named "Price, Minimum" and "Price, Maximum" */
export const Range: Story = {
    render: () => <RangeDemo />,
};

const packages = [
    { value: 0, label: 'Off' },
    { value: 25, label: 'Basic' },
    { value: 50, label: 'Pro' },
    { value: 100, label: 'Max' },
];

function MarksDemo() {
    const [value, setValue] = useState([50]);
    return (
        <Slider
            value={value}
            onValueChange={setValue}
            label="Package"
            marks={packages}
            restrictToMarks
            className="w-80"
        />
    );
}

/** Marks with labels; restrictToMarks allows only these values (arrow keys go from mark to mark) */
export const Marks: Story = { render: () => <MarksDemo /> };

function VerticalDemo() {
    const [value, setValue] = useState([30]);
    return (
        <div className="h-64">
            <Slider
                value={value}
                onValueChange={setValue}
                label="Level"
                orientation="vertical"
                marks={[0, 50, 100]}
                formatValue={(v) => `${v}%`}
            />
        </div>
    );
}

export const Vertical: Story = { render: () => <VerticalDemo /> };

function MinRangeDemo() {
    const [value, setValue] = useState([200, 800]);
    return (
        <Slider
            value={value}
            onValueChange={setValue}
            label="Price"
            max={1000}
            step={10}
            minRange={100}
            formatValue={(v) => `€${v}`}
            className="w-80"
        />
    );
}

/** Range with a minimum distance of €100 between the thumbs */
export const MinRange: Story = { render: () => <MinRangeDemo /> };

function ApplyOnReleaseDemo() {
    const [applied, setApplied] = useState([50]);
    return (
        <div className="flex w-80 flex-col gap-3">
            <Slider
                label="Minimum load"
                defaultValue={[50]}
                formatValue={(v) => `${v}%`}
                onValueChangeEnd={setApplied}
            />
            <span className="text-xs text-muted">Filter applied: {applied[0]}%</span>
        </div>
    );
}

/**
 * Apply on release: without `value` the slider keeps its own value (`defaultValue`); `onValueChangeEnd` reports it
 * once the thumb is let go – e.g. to filter only then. Change its `key` to set it back from outside
 */
export const ApplyOnRelease: Story = { name: 'Apply on release', render: () => <ApplyOnReleaseDemo /> };
