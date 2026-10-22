import { Archive, Download, Trash2 } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Button from '../Button/Button.vue';
import Checkbox from '../Checkbox/Checkbox.vue';
import ActionBar from './ActionBar.vue';

const files = ['Quote.pdf', 'Invoice-2026-10.pdf', 'Contract.docx', 'Presentation.pptx'];

const meta = {
    title: 'Data/ActionBar',
    component: ActionBar,
    args: { count: 0, placement: 'inline' },
    argTypes: { placement: { control: 'inline-radio', options: ['fixed', 'inline'] } },
    render: (args) => ({
        components: { ActionBar, Button, Checkbox },
        setup: () => ({ args, files, selected: ref(['Quote.pdf', 'Contract.docx']), Archive, Download, Trash2 }),
        template: `
            <div class="flex w-[34rem] flex-col gap-4">
                <ul class="flex flex-col gap-2">
                    <li v-for="file in files" :key="file">
                        <Checkbox
                            :checked="selected.includes(file)"
                            @update:checked="selected = $event ? [...selected, file] : selected.filter((name) => name !== file)"
                        >{{ file }}</Checkbox>
                    </li>
                </ul>
                <ActionBar v-bind="args" :count="selected.length" @clear="selected = []">
                    <Button variant="text" size="sm" :leading-icon="Download">Download</Button>
                    <Button variant="text" size="sm" :leading-icon="Archive">Archive</Button>
                    <Button variant="text" size="sm" :leading-icon="Trash2">Delete</Button>
                </ActionBar>
            </div>`,
    }),
} satisfies Meta<typeof ActionBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
