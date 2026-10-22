import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Button from '../Button/Button.vue';
import Input from '../Input/Input.vue';
import Inplace from './Inplace.vue';

const meta = {
    title: 'Forms/Inplace',
    component: Inplace,
    render: () => ({
        components: { Button, Inplace, Input },
        setup: () => ({ name: ref('web-01'), draft: ref('web-01') }),
        template: `
            <div class="flex items-center gap-2 text-sm">
                <span class="text-muted">Server name:</span>
                <Inplace @update:active="$event && (draft = name)">
                    <template #display>{{ name }}</template>
                    <template #default="{ close }">
                        <Input v-model="draft" size="sm" aria-label="Server name" class="w-40" @keydown.enter="name = draft; close()" />
                        <Button size="sm" @click="name = draft; close()">Save</Button>
                    </template>
                </Inplace>
            </div>`,
    }),
} satisfies Meta<typeof Inplace>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
