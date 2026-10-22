import { Building2 } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Avatar from './Avatar.vue';
import AvatarGroup from './AvatarGroup.vue';

const meta = {
    title: 'Data/Avatar',
    component: Avatar,
    args: { name: 'Julia Klein', variant: 'solid', size: 'lg', shape: 'circle' },
    argTypes: {
        variant: { control: 'inline-radio', options: ['solid', 'outline', 'soft'] },
        size: { control: 'inline-radio', options: ['sm', 'md', 'lg', 'xl', '2xl'] },
        color: { control: 'select', options: [undefined, 'auto', 'primary', 'success', 'info', 'warn', 'danger'] },
        shape: { control: 'inline-radio', options: ['circle', 'square'] },
        icon: { control: false },
    },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Overview: Story = {
    render: () => ({
        components: { Avatar },
        setup: () => ({ Building2 }),
        template: `
            <div class="flex items-center gap-2.5">
                <Avatar name="Julia Klein" variant="solid" size="lg" />
                <Avatar name="Max Schulz" variant="outline" />
                <Avatar size="sm" />
                <Avatar :icon="Building2" variant="outline" shape="square" />
            </div>`,
    }),
};

export const Group: Story = {
    render: () => ({
        components: { Avatar, AvatarGroup },
        template: `
            <AvatarGroup label="Project team" :more="5">
                <Avatar name="Julia Klein" />
                <Avatar name="Max Schulz" />
                <Avatar name="Anna Berg" />
                <Avatar name="Lena Wolf" />
            </AvatarGroup>`,
    }),
};

export const Sizes: Story = {
    render: () => ({
        components: { Avatar },
        template: `
            <div class="flex items-center gap-2.5">
                <Avatar v-for="size in ['sm', 'md', 'lg', 'xl', '2xl']" :key="size" name="Julia Klein" :size="size" color="auto" />
            </div>`,
    }),
};

/** `color="auto"`: the same name always gets the same token colour (all meet 4.5:1); a broken image falls back */
export const Colors: Story = {
    render: () => ({
        components: { Avatar },
        setup: () => ({ names: ['Julia Klein', 'Max Schulz', 'Anna Berg', 'Lena Wolf', 'Tom Hahn'] }),
        template: `
            <div class="flex items-center gap-2.5">
                <Avatar v-for="name in names" :key="name" :name="name" color="auto" size="lg" />
                <Avatar name="Missing image" src="/does-not-exist.jpg" color="auto" size="lg" shape="square" />
            </div>`,
    }),
};
