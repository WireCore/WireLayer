import { ClipboardPaste, Copy, Scissors } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import ContextMenu from './ContextMenu.vue';

const items = [
    { value: 'cut', label: 'Cut', icon: Scissors, shortcut: '⌘X' },
    { value: 'copy', label: 'Copy', icon: Copy, shortcut: '⌘C' },
    { value: 'paste', label: 'Paste', icon: ClipboardPaste, shortcut: '⌘V' },
    { type: 'separator' as const },
    { value: 'select-all', label: 'Select all' },
];

const meta = {
    title: 'Overlays/ContextMenu',
    component: ContextMenu,
    args: { items },
    argTypes: { items: { control: false } },
    render: (args) => ({
        components: { ContextMenu },
        setup: () => ({ args, selected: ref('') }),
        template: `
            <div class="flex flex-col items-center gap-3">
                <ContextMenu v-bind="args" @select="selected = $event">
                    <div
                        tabindex="0"
                        class="flex h-40 w-72 items-center justify-center rounded-xl border border-dashed border-line-strong text-sm text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
                    >
                        Right-click or Shift+F10
                    </div>
                </ContextMenu>
                <p class="h-4 text-xs text-muted" aria-live="polite">{{ selected && 'Selected: ' + selected }}</p>
            </div>`,
    }),
} satisfies Meta<typeof ContextMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/**
 * The same item kinds as Menu: checkbox items, a radio group, links. On touch screens a long press (half a second)
 * opens the menu at the finger.
 */
export const ItemTypes: Story = {
    args: {
        items: [
            { type: 'checkbox', value: 'wrap', label: 'Wrap lines', checked: true },
            { type: 'checkbox', value: 'numbers', label: 'Line numbers' },
            { type: 'separator' },
            {
                type: 'radio',
                name: 'size',
                label: 'Font size',
                value: 'm',
                items: [
                    { value: 's', label: 'Small' },
                    { value: 'm', label: 'Medium' },
                    { value: 'l', label: 'Large' },
                ],
            },
        ],
    },
};
