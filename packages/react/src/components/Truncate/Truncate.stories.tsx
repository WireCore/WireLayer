import type { Meta, StoryObj } from '@storybook/react-vite';
import { Truncate } from './Truncate.js';

const text =
    'Migration of the customer portal to the new platform with single sign-on, multi-tenancy, archiving and a new reporting system for management';

const meta = {
    title: 'Data/Truncate',
    component: Truncate,
    args: { text },
    render: (args) => (
        <div className="w-72 rounded-lg border border-line p-3 text-sm">
            <Truncate {...args} />
        </div>
    ),
} satisfies Meta<typeof Truncate>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One line with an ellipsis; while cut, the text is focusable and shows the full text as a tooltip */
export const Playground: Story = {};

/** Several lines (line clamp) */
export const Lines: Story = { name: 'Lines', args: { lines: 3, as: 'p' } };

/** "Show more" instead of the tooltip (aria-expanded) */
export const Expandable: Story = { name: 'Expandable', args: { lines: 2, as: 'p', expandable: true } };

/** Short text: no tooltip, not focusable */
export const Fits: Story = { name: 'Fits', args: { text: 'Customer portal' } };
