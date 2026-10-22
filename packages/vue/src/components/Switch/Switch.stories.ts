import { BellRing, Check, Mail, Moon, Sun, X } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Switch from './Switch.vue';

const meta = {
    title: 'Forms/Switch',
    component: Switch,
    args: { description: 'Notify me about outages', disabled: false },
    argTypes: { icon: { control: false } },
    render: (args) => ({
        components: { Switch },
        setup: () => ({ args, BellRing }),
        template: '<Switch v-bind="args" :icon="BellRing" class="w-[380px]">Monitoring alerts</Switch>',
    }),
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Settings: Story = {
    render: () => ({
        components: { Switch },
        setup: () => ({ BellRing, Mail }),
        template: `
            <div class="flex w-[380px] flex-col">
                <Switch :icon="BellRing" description="Notify me about outages" default-checked>
                    Monitoring alerts
                </Switch>
                <Switch :icon="Mail" description="Summary by email">Weekly report</Switch>
            </div>`,
    }),
};

/** Icon in the thumb or a short text in the track – decoration, the state is announced by the switch */
export const ThumbAndTrack: Story = {
    render: () => ({
        components: { Switch },
        setup: () => ({ Check, Moon, Sun, X }),
        template: `
            <div class="flex w-80 flex-col gap-1">
                <Switch :checked-icon="Check" :unchecked-icon="X" default-checked>Automatic updates</Switch>
                <Switch :checked-icon="Moon" :unchecked-icon="Sun">Dark theme</Switch>
                <Switch on-label="On" off-label="Off">Notifications</Switch>
            </div>`,
    }),
};
