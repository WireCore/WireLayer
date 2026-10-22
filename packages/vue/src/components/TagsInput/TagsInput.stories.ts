import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Field from '../Field/Field.vue';
import TagsInput from './TagsInput.vue';

const meta = {
    title: 'Forms/TagsInput',
    component: TagsInput,
    args: { placeholder: 'Add keyword', max: 8, disabled: false, invalid: false },
    render: (args) => ({
        components: { Field, TagsInput },
        setup: () => ({ args, tags: ref(['hosting', 'frankfurt']) }),
        template: `
            <div class="flex w-96 flex-col gap-3">
                <Field label="Keywords" helper-text="Enter or comma adds"><TagsInput v-bind="args" v-model="tags" /></Field>
                <span class="text-xs text-muted">Value: {{ tags.join(', ') || '–' }}</span>
            </div>`,
    }),
} satisfies Meta<typeof TagsInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Emails: Story = {
    render: () => ({
        components: { Field, TagsInput },
        setup: () => ({ isEmail: (value: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value) }),
        template: `
            <Field label="Recipients" helper-text="Valid email addresses only" class="w-96">
                <TagsInput :validate="isEmail" placeholder="name@company.com" />
            </Field>`,
    }),
};

/** `suggestions`: shown while typing (already added ones are left out); Arrow down opens them, Enter adds */
export const Suggestions: Story = {
    name: 'With suggestions',
    render: () => ({
        components: { Field, TagsInput },
        setup: () => ({
            tags: ref(['linux']),
            suggestions: ['linux', 'docker', 'kubernetes', 'postgresql', 'nginx', 'redis', 'grafana', 'ansible'],
        }),
        template: `
            <div class="flex w-96 flex-col gap-3">
                <Field label="Technologies" helper-text="Pick a suggestion or type freely">
                    <TagsInput v-model="tags" :suggestions="suggestions" placeholder="Technology" />
                </Field>
                <span class="text-xs text-muted">Value: {{ tags.join(', ') || '–' }}</span>
            </div>`,
    }),
};
