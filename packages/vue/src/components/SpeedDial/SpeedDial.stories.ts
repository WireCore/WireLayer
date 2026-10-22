import { FilePlus, ServerCog, UserPlus } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import SpeedDial from './SpeedDial.vue';

const items = [
    { value: 'server', label: 'Create server', icon: ServerCog },
    { value: 'user', label: 'Invite person', icon: UserPlus },
    { value: 'doc', label: 'Create document', icon: FilePlus },
];

const meta = {
    title: 'Buttons/SpeedDial',
    component: SpeedDial,
    args: { items, label: 'Create new' },
    argTypes: { items: { control: false } },
    render: (args) => ({
        components: { SpeedDial },
        setup: () => ({ args, chosen: ref('') }),
        template: `
            <div class="flex h-80 flex-col items-end justify-end gap-3">
                <p class="h-4 text-xs text-muted" aria-live="polite">{{ chosen && 'Selected: ' + chosen }}</p>
                <SpeedDial v-bind="args" @select="chosen = $event" />
            </div>`,
    }),
} satisfies Meta<typeof SpeedDial>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** In a full circle around the button; the labels show as tooltips on hover and focus */
export const Circle: Story = {
    args: { layout: 'circle', direction: 'up' },
    render: (args) => ({
        components: { SpeedDial },
        setup: () => ({ args }),
        template: `<div class="flex h-80 items-center justify-center"><SpeedDial v-bind="args" /></div>`,
    }),
};

/** Half circle above the button */
export const Semicircle: Story = {
    args: { layout: 'semicircle' },
    render: (args) => ({
        components: { SpeedDial },
        setup: () => ({ args }),
        template: `<div class="flex h-72 items-end justify-center pb-6"><SpeedDial v-bind="args" /></div>`,
    }),
};

/** Quarter circle from a button in the bottom-end corner */
export const Quarter: Story = { args: { layout: 'quarter', radius: 96 } };
