import { Trash2 } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Button from '../Button/Button.vue';
import ConfirmPopup from './ConfirmPopup.vue';

const meta = {
    title: 'Overlays/ConfirmPopup',
    component: ConfirmPopup,
    args: { message: 'Really delete server web-01?', confirmLabel: 'Delete', danger: true },
    render: (args) => ({
        components: { Button, ConfirmPopup },
        setup: () => ({ args, Trash2, answer: ref('') }),
        template: `
            <div class="flex flex-col items-center gap-3">
                <ConfirmPopup v-bind="args" @confirm="answer = 'deleted'" @cancel="answer = 'canceled'">
                    <Button variant="outline" :leading-icon="Trash2">Delete</Button>
                </ConfirmPopup>
                <p class="h-4 text-xs text-muted" aria-live="polite">{{ answer && 'Answer: ' + answer }}</p>
            </div>`,
    }),
} satisfies Meta<typeof ConfirmPopup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
