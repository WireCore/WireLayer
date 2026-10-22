import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref, type ConcreteComponent } from 'vue';
import DatePicker from '../DatePicker/DatePicker.vue';
import NativeSelect from '../NativeSelect/NativeSelect.vue';
import NumberInput from '../NumberInput/NumberInput.vue';
import Textarea from '../Textarea/Textarea.vue';
import InlineEdit from './InlineEdit.vue';

const statuses = [
    { value: 'planning', label: 'Planning' },
    { value: 'in-progress', label: 'In progress' },
    { value: 'in-operation', label: 'In operation' },
];

const meta = {
    title: 'Forms/InlineEdit',
    // Generic component: Storybook's Vue types can't infer the args here
    component: InlineEdit as ConcreteComponent,
    render: () => ({
        components: { InlineEdit },
        setup: () => ({ name: ref('Customer portal') }),
        template: `
            <div class="flex w-80 flex-col gap-2">
                <InlineEdit v-model="name" label="Project name" class="text-lg font-semibold" />
                <p class="text-xs text-muted">Saved: {{ name }}</p>
            </div>`,
    }),
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Click (or Enter) edits, Enter saves, Escape cancels – the focus returns to the text */
export const Playground: Story = {};

/** The editor in a popover next to the value */
export const Popover: Story = {
    render: () => ({
        components: { InlineEdit },
        setup: () => ({ owner: ref('Anna Berg') }),
        template: `<InlineEdit v-model="owner" label="Owner" mode="popover" />`,
    }),
};

/** An asynchronous check: the message keeps the editor open (and is announced) */
export const Validation: Story = {
    name: 'Validation',
    render: () => ({
        components: { InlineEdit },
        setup() {
            const slug = ref('customer-portal');
            const validate = async (value: string | undefined) => {
                await new Promise((done) => setTimeout(done, 600));
                if (!value || !/^[a-z0-9-]+$/.test(value)) return 'Lowercase letters, digits and hyphens only';
                if (value === 'intranet') return 'This address is already taken';
                return undefined;
            };
            return { slug, validate };
        },
        template: `<InlineEdit v-model="slug" label="Address" :validate="validate" :format="(value) => '/' + value" />`,
    }),
};

/** Other editors through the #editor slot: Textarea (Ctrl/⌘+Enter saves), select, number and date */
export const Editors: Story = {
    name: 'Editors',
    render: () => ({
        components: { DatePicker, InlineEdit, NativeSelect, NumberInput, Textarea },
        setup: () => ({
            note: ref('Call back on Monday'),
            status: ref('in-progress'),
            budget: ref<number | null>(12000),
            due: ref<string | null>('2026-11-30'),
            statuses,
            statusLabel: (value: string) => statuses.find((entry) => entry.value === value)?.label ?? '',
            euro: (value: number | null | undefined) =>
                value == null
                    ? ''
                    : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(value),
            date: (value: string | null | undefined) =>
                value ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value)) : '',
        }),
        template: `
            <dl class="grid w-[460px] grid-cols-[max-content_1fr] items-center gap-x-6 gap-y-3 text-sm">
                <dt class="text-muted">Note</dt>
                <dd><InlineEdit v-model="note" label="Note">
                    <template #editor="{ value, setValue, label }"><Textarea :model-value="value" :aria-label="label" @update:model-value="setValue" /></template>
                </InlineEdit></dd>
                <dt class="text-muted">Status</dt>
                <dd><InlineEdit v-model="status" label="Status" :format="statusLabel">
                    <template #editor="{ value, setValue, label }"><NativeSelect :items="statuses" :model-value="value" :aria-label="label" size="sm" @update:model-value="setValue" /></template>
                </InlineEdit></dd>
                <dt class="text-muted">Budget</dt>
                <dd><InlineEdit v-model="budget" label="Budget" :format="euro">
                    <template #editor="{ value, setValue, label }"><NumberInput :model-value="value" :aria-label="label" size="sm" @update:model-value="setValue" /></template>
                </InlineEdit></dd>
                <dt class="text-muted">Due date</dt>
                <dd><InlineEdit v-model="due" label="Due date" :format="date" mode="popover">
                    <template #editor="{ value, setValue, label }"><DatePicker :model-value="value" :aria-label="label" size="sm" @update:model-value="setValue" /></template>
                </InlineEdit></dd>
            </dl>`,
    }),
};
