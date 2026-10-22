import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Badge from '../components/Badge/Badge.vue';
import Button from '../components/Button/Button.vue';
import Input from '../components/Input/Input.vue';
import { useClipboard, useNetwork } from './browser.js';
import { useColorScheme, useMediaQuery, useReducedMotion } from './media.js';
import { useDisclosure, useStateHistory } from './state.js';
import { useLocalStorage } from './storage.js';
import { useDebouncedValue, useIdle } from './timing.js';

// A few composables at work – all of them are exported from @wirecore/wirelayer-vue (same names as the React hooks)
const demo = () => ({
    components: { Badge, Button, Input },
    setup() {
        const wide = useMediaQuery('(min-width: 768px)');
        const reducedMotion = useReducedMotion();
        const scheme = useColorScheme();
        const network = useNetwork();
        const idle = useIdle(5000);
        const panel = useDisclosure();
        const clipboard = useClipboard();
        const note = useLocalStorage('wirecore-story-note', '');
        const searched = useDebouncedValue(note, 400);
        const history = useStateHistory(0);
        return { wide, reducedMotion, scheme, network, idle, panel, clipboard, note, searched, history };
    },
    template: `
        <div class="grid w-[min(640px,92vw)] gap-4 text-sm sm:grid-cols-2">
            <section class="flex flex-col gap-2 rounded-xl border border-line p-4">
                <h3 class="m-0 font-semibold">Environment</h3>
                <p class="m-0">Wider than 768 px: <Badge>{{ wide ? 'yes' : 'no' }}</Badge></p>
                <p class="m-0">Reduced motion: <Badge>{{ reducedMotion ? 'yes' : 'no' }}</Badge></p>
                <p class="m-0">System color scheme: <Badge>{{ scheme }}</Badge></p>
                <p class="m-0">Online: <Badge>{{ network.online ? 'yes' : 'no' }}</Badge> · Idle (5 s): <Badge>{{ idle ? 'yes' : 'no' }}</Badge></p>
            </section>
            <section class="flex flex-col items-start gap-2 rounded-xl border border-line p-4">
                <h3 class="m-0 font-semibold">State</h3>
                <Button size="sm" variant="outline" :aria-expanded="panel.opened.value" @click="panel.toggle">{{ panel.opened.value ? 'Hide' : 'Show' }} details</Button>
                <p v-if="panel.opened.value" class="m-0 text-muted">useDisclosure: open</p>
                <div class="flex items-center gap-2">
                    <Button size="sm" variant="outline" @click="history.set(history.value.value + 1)">+1</Button>
                    <Button size="sm" variant="text" :disabled="!history.canUndo.value" @click="history.undo()">Undo</Button>
                    <Button size="sm" variant="text" :disabled="!history.canRedo.value" @click="history.redo()">Redo</Button>
                    <span class="tabular-nums">{{ history.value.value }}</span>
                </div>
            </section>
            <section class="flex flex-col gap-2 rounded-xl border border-line p-4 sm:col-span-2">
                <h3 class="m-0 font-semibold">Storage, debounce, clipboard</h3>
                <Input v-model="note" aria-label="Note (kept after reload)" placeholder="Note – kept after reload" />
                <p class="m-0 text-muted">Debounced (400 ms): {{ searched }}</p>
                <Button size="sm" variant="outline" class="self-start" @click="clipboard.copy(note)">{{ clipboard.copied.value ? 'Copied' : 'Copy note' }}</Button>
            </section>
        </div>`,
});

const meta = {
    title: 'Utilities/Hooks',
    render: demo,
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Composables of @wirecore/wirelayer-vue: media queries, network, idle, disclosure, undo/redo, localStorage, debounce, clipboard
 * – and more (useHotkeys, useFocusTrap, useIntersection, useScrollSpy …), without VueUse
 */
export const Playground: Story = {};
