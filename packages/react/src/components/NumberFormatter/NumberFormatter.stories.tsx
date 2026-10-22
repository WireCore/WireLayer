import type { Meta, StoryObj } from '@storybook/react-vite';
import { NumberFormatter } from './NumberFormatter.js';

const meta = {
    title: 'Data/NumberFormatter',
    component: NumberFormatter,
    args: { value: 1234567.891 },
    render: (args) => (
        <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-muted">Number</dt>
            <dd>
                <NumberFormatter value={args.value} />
            </dd>
            <dt className="text-muted">Currency</dt>
            <dd>
                <NumberFormatter value={args.value} formatOptions={{ style: 'currency', currency: 'EUR' }} />
            </dd>
            <dt className="text-muted">Percent</dt>
            <dd>
                <NumberFormatter value={0.284} formatOptions={{ style: 'percent', maximumFractionDigits: 1 }} />
            </dd>
            <dt className="text-muted">Compact</dt>
            <dd>
                <NumberFormatter value={args.value} formatOptions={{ notation: 'compact' }} />
            </dd>
            <dt className="text-muted">Unit</dt>
            <dd>
                <NumberFormatter value={512} formatOptions={{ style: 'unit', unit: 'gigabyte' }} />
            </dd>
        </dl>
    ),
} satisfies Meta<typeof NumberFormatter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
