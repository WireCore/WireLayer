import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Button from '../Button/Button.vue';
import FloatingPanel from './FloatingPanel.vue';

const meta = {
    title: 'Overlays/FloatingPanel',
    component: FloatingPanel,
    args: { title: 'Notes', resizable: true, draggable: true },
    render: (args) => ({
        components: { Button, FloatingPanel },
        setup: () => ({ args }),
        template: `
            <FloatingPanel v-bind="args">
                <template #trigger><Button variant="outline">Open notes</Button></template>
                <p>A window that stays open next to the page. Drag the header to move it, or the edges to resize it.</p>
                <p class="mt-2 text-muted">Keyboard: Alt + arrow keys move, Alt + Shift + arrow keys resize, Escape closes.</p>
            </FloatingPanel>`,
    }),
} satisfies Meta<typeof FloatingPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Not modal: the page stays usable; minimize, maximize and close in the header */
export const Playground: Story = {};

/** Position and size are kept in localStorage (storageKey) */
export const RememberPosition: Story = {
    render: () => ({
        components: { Button, FloatingPanel },
        setup: () => ({ open: ref(true) }),
        template: `
            <div class="flex flex-col items-start gap-2">
                <Button variant="outline" @click="open = !open">{{ open ? 'Close' : 'Open' }}</Button>
                <FloatingPanel v-model:open="open" title="Tools" storage-key="wirecore-story-panel" :default-position="{ x: 40, y: 120 }" :default-size="{ width: 320, height: 220 }">
                    <p>Move it, reload – the window opens again in the same place.</p>
                </FloatingPanel>
            </div>`,
    }),
};
