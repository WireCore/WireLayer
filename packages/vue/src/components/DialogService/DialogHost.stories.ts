import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { defineComponent, h, ref, type PropType } from 'vue';
import Button from '../Button/Button.vue';
import DialogHost from './DialogHost.vue';
import { openDialog } from './dialogs.js';
import RenameForm from './RenameForm.vue';

const meta = {
    title: 'Overlays/DialogService',
    component: DialogHost,
    render: () => ({
        components: { Button, DialogHost },
        setup: () => {
            const name = ref('web-01');
            const rename = async () => {
                const result = await openDialog<string>({
                    title: 'Rename server',
                    description: 'The name appears in all overviews.',
                    component: RenameForm,
                    props: { current: name.value },
                });
                if (result) name.value = result;
            };
            return { name, rename };
        },
        template: `
            <div class="flex flex-col items-center gap-3">
                <Button @click="rename">Rename …</Button>
                <p class="text-xs text-muted" aria-live="polite">Name: {{ name }}</p>
                <DialogHost />
            </div>`,
    }),
} satisfies Meta<typeof DialogHost>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

// Shows the data passed with openDialog({ data }) and closes with a result
const ServerDetails = defineComponent({
    props: {
        data: { type: Object as PropType<{ name: string; location: string }>, required: true },
        close: { type: Function, required: true },
    },
    setup: (props) => () =>
        h('div', { class: 'mt-2 flex flex-col gap-3 text-sm' }, [
            h('p', `${props.data.name} is located in ${props.data.location}.`),
            h(Button, { size: 'sm', class: 'self-end', onClick: () => props.close('ok') }, () => 'Done'),
        ]),
});

/**
 * Data for the dialog (`data`), size and position; the returned handle changes the open dialog (`update`) and
 * `closeAllDialogs()` closes every dialog of the host.
 */
export const DataSizeAndUpdate: Story = {
    render: () => ({
        components: { Button, DialogHost },
        setup: () => {
            const result = ref('');
            const open = async () => {
                const dialog = openDialog<string>({
                    title: 'web-01',
                    description: 'Loading …',
                    component: ServerDetails,
                    data: { name: 'web-01', location: 'Frankfurt' },
                    size: 'lg',
                    position: 'top',
                });
                setTimeout(() => dialog.update({ description: 'Ubuntu 26.04 · 8 vCPU · 32 GB' }), 1000);
                result.value = (await dialog) ?? 'Closed';
            };
            return { open, result };
        },
        template: `
            <div class="flex flex-col items-center gap-3">
                <Button @click="open">Show details</Button>
                <p class="text-xs text-muted" aria-live="polite">{{ result }}</p>
                <DialogHost />
            </div>`,
    }),
};
