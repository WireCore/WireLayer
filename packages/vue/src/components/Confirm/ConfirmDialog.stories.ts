import { Trash2 } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Button from '../Button/Button.vue';
import { confirm, prompt } from './confirm.js';
import ConfirmDialog from './ConfirmDialog.vue';

const meta = {
    title: 'Overlays/Confirm',
    component: ConfirmDialog,
    render: () => ({
        components: { Button, ConfirmDialog },
        setup() {
            const result = ref('');
            const remove = async () => {
                const confirmed = await confirm({
                    title: 'Delete server?',
                    description: 'web-01 and all snapshots will be permanently removed.',
                    confirmLabel: 'Delete',
                    status: 'danger',
                    icon: Trash2,
                });
                result.value = confirmed ? 'Deleted' : 'Canceled';
            };
            return { remove, result, Trash2 };
        },
        template: `
            <div class="flex items-center gap-3">
                <Button variant="danger" :leading-icon="Trash2" @click="remove">Delete server</Button>
                <span class="text-sm text-muted" aria-live="polite">{{ result }}</span>
                <ConfirmDialog />
            </div>`,
    }),
} satisfies Meta<typeof ConfirmDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/**
 * `prompt()` asks for a text (with validation, Enter confirms) and resolves with it or null; `typeToConfirm` lets
 * a deletion only go through after typing the name.
 */
export const PromptAndTypeToConfirm: Story = {
    render: () => ({
        components: { Button, ConfirmDialog },
        setup() {
            const result = ref('');
            const rename = async () => {
                const name = await prompt({
                    title: 'Rename server',
                    label: 'New name',
                    defaultValue: 'web-01',
                    validate: (value) =>
                        /^[a-z0-9-]{3,}$/.test(value) ? undefined : 'At least 3 characters: a–z, 0–9, -',
                });
                result.value = name === null ? 'Canceled' : `New name: ${name}`;
            };
            const remove = async () => {
                const confirmed = await confirm({
                    title: 'Permanently delete web-01?',
                    description: 'All data and snapshots will be lost.',
                    confirmLabel: 'Delete',
                    status: 'danger',
                    icon: Trash2,
                    typeToConfirm: 'web-01',
                });
                result.value = confirmed ? 'Deleted' : 'Canceled';
            };
            return { rename, remove, result };
        },
        template: `
            <div class="flex flex-wrap items-center gap-3">
                <Button variant="outline" @click="rename">Rename …</Button>
                <Button variant="danger" @click="remove">Delete permanently …</Button>
                <span class="text-sm text-muted" aria-live="polite">{{ result }}</span>
                <ConfirmDialog />
            </div>`,
    }),
};
