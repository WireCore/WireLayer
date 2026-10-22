import { Bold, Copy, Italic, Underline } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Button from '../Button/Button.vue';
import IconButton from '../IconButton/IconButton.vue';
import Tooltip from './Tooltip.vue';
import TooltipGroup from './TooltipGroup.vue';

const meta = {
    title: 'Overlays/Tooltip',
    component: Tooltip,
    args: { content: 'Copy configuration', placement: 'top', openDelay: 400, closeDelay: 150 },
    argTypes: { placement: { control: 'inline-radio', options: ['top', 'bottom', 'left', 'right'] } },
    render: (args) => ({
        components: { IconButton, Tooltip },
        setup: () => ({ args, Copy }),
        template: `
            <Tooltip v-bind="args">
                <IconButton :icon="Copy" label="Copy" />
            </Tooltip>`,
    }),
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/**
 * TooltipGroup: after the first tooltip of a toolbar, the next ones open without delay. On touch screens a long press
 * shows a tooltip, a tap elsewhere hides it.
 */
export const Group: Story = {
    render: () => ({
        components: { IconButton, Tooltip, TooltipGroup },
        setup: () => ({ Bold, Italic, Underline }),
        template: `
            <TooltipGroup>
                <div class="flex gap-1">
                    <Tooltip content="Bold (Ctrl+B)"><IconButton :icon="Bold" label="Bold" variant="text" /></Tooltip>
                    <Tooltip content="Italic (Ctrl+I)"><IconButton :icon="Italic" label="Italic" variant="text" /></Tooltip>
                    <Tooltip content="Underline (Ctrl+U)"><IconButton :icon="Underline" label="Underline" variant="text" /></Tooltip>
                </div>
            </TooltipGroup>`,
    }),
};

/**
 * A disabled button gets neither pointer nor focus events – the focusable wrapper carries the tooltip, so keyboard
 * users learn why it is disabled. The tooltip needs no element of its own: it uses its child as the trigger.
 */
export const DisabledButton: Story = {
    render: () => ({
        components: { Button, Tooltip },
        template: `
            <Tooltip content="Fill in all required fields first">
                <span tabindex="0" class="inline-flex rounded-full"><Button disabled>Publish</Button></span>
            </Tooltip>`,
    }),
};

/** Follows the mouse pointer over a larger area, e.g. a chart */
export const FollowCursor: Story = {
    render: () => ({
        components: { Tooltip },
        template: `
            <Tooltip content="Load 42%" follow-cursor :interactive="false">
                <div tabindex="0" class="flex h-32 w-72 items-center justify-center rounded-xl border border-dashed border-line-strong text-sm text-muted">
                    Move the pointer
                </div>
            </Tooltip>`,
    }),
};
