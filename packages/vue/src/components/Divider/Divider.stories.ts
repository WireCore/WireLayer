import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Divider from './Divider.vue';

const meta = {
    title: 'Layout/Divider',
    component: Divider,
    args: { orientation: 'horizontal', label: '' },
    argTypes: { orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] } },
    render: (args) => ({
        components: { Divider },
        setup: () => ({ args }),
        template: `<div class="flex h-24 w-80 items-center justify-center"><Divider v-bind="args" /></div>`,
    }),
} satisfies Meta<typeof Divider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Overview: Story = {
    render: () => ({
        components: { Divider },
        template: `
            <div class="flex w-80 flex-col gap-5 text-sm text-fg">
                <span>Sign in with email</span>
                <Divider label="or" />
                <span>Sign in with single sign-on</span>
                <Divider />
                <div class="flex h-6 items-center gap-3"><span>Hosting</span><Divider orientation="vertical" /><span>Cloud</span></div>
            </div>`,
    }),
};

/** Label at the start or end, dashed and dotted lines */
export const Variants: Story = {
    render: () => ({
        components: { Divider },
        template: `
            <div class="flex w-80 flex-col gap-5 text-sm text-fg">
                <Divider label="Details" label-position="start" />
                <Divider label="End" label-position="end" line-style="dashed" />
                <Divider line-style="dashed" />
                <Divider label="or" line-style="dotted" />
            </div>`,
    }),
};
