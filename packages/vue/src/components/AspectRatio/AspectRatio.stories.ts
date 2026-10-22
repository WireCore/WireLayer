import type { Meta, StoryObj } from '@storybook/vue3-vite';
import AspectRatio from './AspectRatio.vue';

const meta = {
    title: 'Layout/AspectRatio',
    component: AspectRatio,
    args: { ratio: 16 / 9 },
    render: (args) => ({
        components: { AspectRatio },
        setup: () => ({ args }),
        template: `
            <AspectRatio v-bind="args" class="max-w-md rounded-xl bg-bg-2">
                <div class="flex size-full items-center justify-center text-sm text-muted">16 : 9</div>
            </AspectRatio>`,
    }),
} satisfies Meta<typeof AspectRatio>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Keeps width to height; an image, video or iframe inside fills it */
export const Playground: Story = {};

/** Square (1) and 4 : 3 */
export const Ratios: Story = {
    render: () => ({
        components: { AspectRatio },
        template: `
            <div class="grid max-w-md grid-cols-2 gap-4">
                <AspectRatio :ratio="1" class="rounded-xl bg-bg-2">
                    <div class="flex size-full items-center justify-center text-sm text-muted">1 : 1</div>
                </AspectRatio>
                <AspectRatio :ratio="4 / 3" class="rounded-xl bg-bg-2">
                    <div class="flex size-full items-center justify-center text-sm text-muted">4 : 3</div>
                </AspectRatio>
            </div>`,
    }),
};
