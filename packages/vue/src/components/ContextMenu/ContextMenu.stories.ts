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

/**
 * A list as in a desktop app: `before-open` gets the right-clicked element – select its row before the menu shows;
 * `v-model:open` tells whether the menu is open (e.g. to pause Delete or F2 on the list). `highlight-first` and the
 * close props as on Menu
 */
export const DesktopList: Story = {
    name: 'Desktop list',
    render: () => ({
        components: { ContextMenu },
        setup() {
            const hosts = ['web-01', 'web-02', 'db-01'];
            const current = ref('web-01');
            const open = ref(false);
            const select = (target: Element) => {
                const row = target.closest<HTMLElement>('[data-host]');
                if (row) current.value = row.dataset.host!;
            };
            return {
                hosts,
                current,
                open,
                select,
                hostItems: [
                    { value: 'connect', label: 'Connect' },
                    { value: 'rename', label: 'Rename', shortcut: 'F2' },
                    { type: 'separator' as const },
                    { value: 'delete', label: 'Delete', shortcut: 'Del', danger: true },
                ],
            };
        },
        template: `
            <div class="flex w-72 flex-col gap-3">
                <ContextMenu
                    v-model:open="open"
                    :items="hostItems"
                    label="Host actions"
                    highlight-first
                    close-on-scroll
                    close-on-resize
                    close-on-blur
                    @before-open="select"
                >
                    <ul class="m-0 flex list-none flex-col rounded-lg border border-line p-1" aria-label="Hosts">
                        <li
                            v-for="host in hosts"
                            :key="host"
                            :data-host="host"
                            class="rounded-md px-2.5 py-1.5 text-sm text-fg"
                            :class="host === current ? 'bg-line font-medium' : ''"
                            :aria-current="host === current || undefined"
                            @click="current = host"
                        >
                            {{ host }}
                        </li>
                    </ul>
                </ContextMenu>
                <span class="text-xs text-muted">Selected: {{ current }} · Menu open: {{ open }}</span>
            </div>`,
    }),
};
