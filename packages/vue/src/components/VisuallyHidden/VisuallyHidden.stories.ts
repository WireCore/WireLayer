import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { Trash2 } from '@lucide/vue';
import VisuallyHidden from './VisuallyHidden.vue';

const meta = {
    title: 'Utilities/VisuallyHidden',
    component: VisuallyHidden,
    render: () => ({
        components: { Trash2, VisuallyHidden },
        template: `
            <div class="flex flex-col gap-3 text-sm">
                <p class="flex items-center gap-2">
                    <Trash2 class="size-4" aria-hidden="true" /> 3 <VisuallyHidden>items in the trash</VisuallyHidden>
                </p>
                <VisuallyHidden as="a" href="#content" focusable>Skip to content (appears with Tab)</VisuallyHidden>
            </div>`,
    }),
} satisfies Meta<typeof VisuallyHidden>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Text only for screen readers; `focusable` shows it while it has the focus */
export const Playground: Story = {};
