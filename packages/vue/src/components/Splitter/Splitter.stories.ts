import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Splitter from './Splitter.vue';

const meta = {
    title: 'Layout/Splitter',
    component: Splitter,
    args: {
        orientation: 'horizontal',
        panels: [
            { id: 'nav', label: 'Navigation', defaultSize: 30, minSize: 15 },
            { id: 'editor', label: 'Editor', minSize: 30 },
        ],
    },
    argTypes: {
        orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
        panels: { control: false },
    },
    render: (args) => ({
        components: { Splitter },
        setup: () => ({ args }),
        template: `
            <Splitter v-bind="args" class="h-72 w-[40rem]">
                <template #panel="{ id }">
                    <div class="p-4 text-sm">{{ id === 'nav' ? 'Navigation' : 'Editor' }}</div>
                </template>
            </Splitter>`,
    }),
} satisfies Meta<typeof Splitter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Vertical: Story = { args: { orientation: 'vertical' } };

/** Sizes in px, a collapsible panel (snaps shut below its minimum, Enter folds it), bigger Shift steps, remembered */
export const PixelsAndCollapsible: Story = {
    args: {
        panels: [
            { id: 'nav', label: 'Navigation', defaultSize: '220px', minSize: '160px', collapsible: true },
            { id: 'editor', label: 'Editor', minSize: 30 },
        ],
        step: 2,
        shiftStep: 20,
        storageKey: 'wirecore-story-splitter',
    },
};

/** A splitter inside a panel of another one */
export const Nested: Story = {
    args: {
        panels: [
            { id: 'nav', label: 'Navigation', defaultSize: 25 },
            { id: 'work', label: 'Workspace' },
        ],
    },
    render: (args) => ({
        components: { Splitter },
        setup: () => ({
            args,
            inner: [
                { id: 'code', label: 'Code', defaultSize: 70 },
                { id: 'terminal', label: 'Terminal', collapsible: true, minSize: 15 },
            ],
        }),
        template: `
            <Splitter v-bind="args" class="h-72 w-[40rem]">
                <template #panel="{ id }">
                    <div v-if="id === 'nav'" class="p-4 text-sm">Navigation</div>
                    <Splitter v-else orientation="vertical" :panels="inner" class="h-full rounded-none border-0">
                        <template #panel="{ id: innerId }">
                            <div class="p-4 text-sm">{{ innerId === 'code' ? 'Code' : 'Terminal' }}</div>
                        </template>
                    </Splitter>
                </template>
            </Splitter>`,
    }),
};
