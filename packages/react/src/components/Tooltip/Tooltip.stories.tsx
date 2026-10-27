import type { Meta, StoryObj } from '@storybook/react-vite';
import { Bold, Copy, Italic, Underline } from 'lucide-react';
import { Button } from '../Button/Button.js';
import { IconButton } from '../IconButton/IconButton.js';
import { Tooltip, TooltipGroup } from './Tooltip.js';

const meta = {
    title: 'Overlays/Tooltip',
    component: Tooltip,
    args: { content: 'Copy configuration', placement: 'top', openDelay: 400, closeDelay: 150, children: <span /> },
    argTypes: {
        placement: { control: 'inline-radio', options: ['top', 'bottom', 'left', 'right'] },
        children: { control: false },
    },
    render: (args) => (
        <Tooltip {...args}>
            <IconButton icon={Copy} label="Copy" />
        </Tooltip>
    ),
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/**
 * TooltipGroup: after the first tooltip of a toolbar, the next ones open without delay. On touch screens a long press
 * shows a tooltip, a tap elsewhere hides it.
 */
export const Group: Story = {
    render: () => (
        <TooltipGroup>
            <div className="flex gap-1">
                <Tooltip content="Bold (Ctrl+B)">
                    <IconButton icon={Bold} label="Bold" variant="text" />
                </Tooltip>
                <Tooltip content="Italic (Ctrl+I)">
                    <IconButton icon={Italic} label="Italic" variant="text" />
                </Tooltip>
                <Tooltip content="Underline (Ctrl+U)">
                    <IconButton icon={Underline} label="Underline" variant="text" />
                </Tooltip>
            </div>
        </TooltipGroup>
    ),
};

/**
 * A disabled button gets neither pointer nor focus events – the focusable wrapper carries the tooltip, so keyboard
 * users learn why it is disabled. The tooltip needs no element of its own: it uses its child as the trigger.
 */
export const DisabledButton: Story = {
    render: () => (
        <Tooltip content="Fill in all required fields first">
            <span tabIndex={0} className="inline-flex rounded-full">
                <Button disabled>Publish</Button>
            </span>
        </Tooltip>
    ),
};

/** Follows the mouse pointer over a larger area, e.g. a chart */
export const FollowCursor: Story = {
    render: () => (
        <Tooltip content="Load 42%" followCursor interactive={false}>
            <div
                tabIndex={0}
                className="flex h-32 w-72 items-center justify-center rounded-xl border border-dashed border-line-strong text-sm text-muted"
            >
                Move the pointer
            </div>
        </Tooltip>
    ),
};

/** `closeOnScroll={false}`: the tooltip stays open while the list around the trigger scrolls */
export const StaysOpenWhileScrolling: Story = {
    name: 'Stays open while scrolling',
    render: () => (
        <div className="h-40 w-72 overflow-y-auto rounded-xl border border-line p-4">
            <div className="flex h-80 flex-col gap-3">
                <Tooltip content="Copies the settings" closeOnScroll={false}>
                    <Button variant="outline">Copy</Button>
                </Tooltip>
                <p className="text-sm text-muted">Focus the button, then scroll this box.</p>
            </div>
        </div>
    ),
};
