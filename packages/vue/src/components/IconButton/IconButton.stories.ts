import { ArrowRight, Bell, Ellipsis, Mail, Pencil, Plus, Trash2, X } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import IconButton from './IconButton.vue';

const meta = {
    title: 'Buttons/IconButton',
    component: IconButton,
    args: { icon: Plus, label: 'Add', variant: 'outline', size: 'md', disabled: false },
    argTypes: {
        icon: { control: false },
        variant: {
            control: 'select',
            options: ['primary', 'secondary', 'success', 'info', 'warn', 'danger', 'outline', 'text', 'soft'],
        },
        color: {
            control: 'select',
            options: [undefined, 'primary', 'secondary', 'success', 'info', 'warn', 'danger', 'contrast'],
        },
        size: { control: 'inline-radio', options: ['xs', 'sm', 'md', 'lg'] },
        shape: { control: 'inline-radio', options: ['pill', 'rounded', 'square'] },
    },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Overview: Story = {
    render: () => ({
        components: { IconButton },
        setup: () => ({ ArrowRight, Ellipsis, Plus, X }),
        template: `
            <div class="flex items-center gap-2">
                <IconButton :icon="Plus" label="Add" variant="primary" />
                <IconButton :icon="ArrowRight" label="Next" />
                <IconButton :icon="Ellipsis" label="More" variant="text" />
                <IconButton :icon="X" label="Close" size="sm" />
            </div>`,
    }),
};

export const Badges: Story = {
    render: () => ({
        components: { IconButton },
        setup: () => ({ Bell, Mail }),
        template: `
            <div class="flex items-center gap-3.5">
                <IconButton :icon="Bell" label="Notifications" :badge="4" />
                <IconButton :icon="Mail" label="Inbox" badge />
            </div>`,
    }),
};

/** Color × style like Button, plus the shapes and the 24px size xs */
export const ColorsAndShapes: Story = {
    render: () => ({
        components: { IconButton },
        setup: () => ({ Pencil, Plus, Trash2 }),
        template: `
            <div class="flex flex-wrap items-center gap-2">
                <IconButton :icon="Trash2" label="Delete" variant="text" color="danger" />
                <IconButton :icon="Pencil" label="Edit" variant="soft" color="info" />
                <IconButton :icon="Plus" label="Add" variant="outline" color="success" shape="rounded" />
                <IconButton :icon="Plus" label="Add" variant="primary" shape="square" />
                <IconButton :icon="Pencil" label="Edit" size="xs" />
            </div>`,
    }),
};

/**
 * `icon-props` go to the icon component – e.g. `{ fill: 'currentColor' }` for a filled Lucide icon (Button: both
 * icons, Badge and ToggleButton the same)
 */
export const FilledIcon: Story = {
    name: 'Filled icon',
    render: () => ({
        components: { IconButton },
        setup: () => ({ Bell, filled: { fill: 'currentColor' } }),
        template: `
            <div class="flex items-center gap-3.5">
                <IconButton :icon="Bell" label="Notifications on" :icon-props="filled" />
                <IconButton :icon="Bell" label="Notifications off" />
            </div>`,
    }),
};

/** `loading`: a spinner instead of the icon, the name stays; focusable, clicks are ignored (like Button) */
export const Loading: Story = {
    render: () => ({
        components: { IconButton },
        setup: () => ({ Pencil, Trash2 }),
        template: `
            <div class="flex items-center gap-3.5">
                <IconButton :icon="Pencil" label="Edit" loading />
                <IconButton :icon="Trash2" label="Delete" variant="danger" loading />
            </div>`,
    }),
};
