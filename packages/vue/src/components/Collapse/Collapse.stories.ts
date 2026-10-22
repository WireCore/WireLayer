import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref, useId } from 'vue';
import Button from '../Button/Button.vue';
import Collapse from './Collapse.vue';

const demo = (orientation?: 'vertical' | 'horizontal') => () => ({
    components: { Button, Collapse },
    setup: () => ({ open: ref(false), id: useId(), orientation }),
    template: `
        <div :class="orientation === 'horizontal' ? 'flex items-start gap-3' : 'flex max-w-md flex-col gap-3'">
            <Button variant="outline" :aria-expanded="open" :aria-controls="id" @click="open = !open">
                {{ orientation === 'horizontal' ? 'Filter' : 'Details' }}
            </Button>
            <Collapse :id="id" :open="open" :orientation="orientation">
                <div class="w-64 rounded-lg border border-line p-4 text-sm text-muted">
                    24-month term, renewing for 12 months at a time, three months' notice to cancel.
                </div>
            </Collapse>
        </div>`,
});

const meta = {
    title: 'Layout/Collapse',
    component: Collapse,
    render: demo(),
} satisfies Meta<typeof Collapse>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Animated height (motion-safe); the button carries aria-expanded and aria-controls */
export const Playground: Story = {};

/** Animated width */
export const Horizontal: Story = { render: demo('horizontal') };
