import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Input from '../Input/Input.vue';
import Kbd from '../Kbd/Kbd.vue';
import { useHotkeys } from '../../composables/hotkeys.js';
import HotkeysDialog from './HotkeysDialog.vue';

// A page with shortcuts: registered with useHotkeys, shown with Kbd, listed in the HotkeysDialog
const page = () => ({
    components: { HotkeysDialog, Input, Kbd },
    setup() {
        const log = ref('–');
        useHotkeys([
            ['mod+s', () => (log.value = 'Saved'), { description: 'Save', group: 'Document' }],
            ['mod+shift+n', () => (log.value = 'New document'), { description: 'New document', group: 'Document' }],
            ['g i', () => (log.value = 'Go to inbox'), { description: 'Go to inbox', group: 'Navigation' }],
            ['g d', () => (log.value = 'Go to dashboard'), { description: 'Go to dashboard', group: 'Navigation' }],
        ]);
        return { log };
    },
    template: `
        <div class="flex w-96 flex-col gap-3 text-sm">
            <p><Kbd hotkey="?" /> shows all shortcuts, <Kbd hotkey="mod+s" /> saves, <Kbd hotkey="g i" /> opens the inbox.</p>
            <Input aria-label="Note" placeholder="Type here: single keys are not shortcuts here" />
            <p class="text-muted" aria-live="polite">Last: {{ log }}</p>
            <HotkeysDialog />
        </div>`,
});

const meta = {
    title: 'Utilities/HotkeysDialog',
    component: HotkeysDialog,
    render: page,
} satisfies Meta<typeof HotkeysDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** "?" opens the overview of the registered shortcuts (grouped, keys per platform: ⌘ or Ctrl) */
export const Playground: Story = {};
