import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Button from '../Button/Button.vue';
import SaveStatus from './SaveStatus.vue';

const meta = {
    title: 'Feedback/SaveStatus',
    component: SaveStatus,
    args: { status: 'saved' },
    argTypes: { status: { control: 'inline-radio', options: ['idle', 'saving', 'saved', 'error'] } },
} satisfies Meta<typeof SaveStatus>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** All states; the texts can be changed per state (`translations`) */
export const States: Story = {
    render: () => ({
        components: { SaveStatus },
        template: `
            <div class="flex flex-col gap-2">
                <SaveStatus status="saving" />
                <SaveStatus status="saved" />
                <SaveStatus status="error" />
                <SaveStatus status="saved" :translations="{ saved: 'Draft saved · 2:32 PM' }" />
            </div>`,
    }),
};

/** Next to a form that saves on its own: the change is announced (role="status") */
export const Autosave: Story = {
    render: () => ({
        components: { Button, SaveStatus },
        setup: () => {
            const status = ref<'idle' | 'saving' | 'saved' | 'error'>('idle');
            const save = (fail: boolean) => {
                status.value = 'saving';
                setTimeout(() => (status.value = fail ? 'error' : 'saved'), 1200);
            };
            return { status, save };
        },
        template: `
            <div class="flex items-center gap-3">
                <Button size="sm" variant="outline" @click="save(false)">Save</Button>
                <Button size="sm" variant="outline" @click="save(true)">Save (error)</Button>
                <SaveStatus :status="status" />
            </div>`,
    }),
};
