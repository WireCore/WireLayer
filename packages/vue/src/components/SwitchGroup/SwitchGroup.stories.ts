import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Switch from '../Switch/Switch.vue';
import SwitchGroup from './SwitchGroup.vue';

const meta = {
    title: 'Forms/SwitchGroup',
    component: SwitchGroup,
    args: { label: 'Notifications', helperText: 'Applies to all projects' },
    render: (args) => ({
        components: { Switch, SwitchGroup },
        setup() {
            const value = ref(['deploy']);
            return { args, value };
        },
        template: `
            <div class="flex w-80 flex-col gap-3">
                <SwitchGroup v-bind="args" v-model="value">
                    <Switch value="deploy" description="Succeeded or failed">Deployments</Switch>
                    <Switch value="backup">Backups</Switch>
                    <Switch value="billing">Invoices</Switch>
                </SwitchGroup>
                <p class="text-xs text-muted">Value: {{ value.join(', ') }}</p>
            </div>`,
    }),
} satisfies Meta<typeof SwitchGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Switches with a value share the group's value (string[]) */
export const Playground: Story = {};

/** At most two switched on */
export const Maximum: Story = { args: { max: 2, helperText: 'At most two' } };
