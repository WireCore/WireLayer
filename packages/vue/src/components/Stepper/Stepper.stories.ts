import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Field from '../Field/Field.vue';
import Input from '../Input/Input.vue';
import Stepper from './Stepper.vue';

const items = [
    { label: 'Contact', description: 'Who are you?' },
    { label: 'Project', description: 'What are you planning?' },
    { label: 'Review', description: 'Is everything correct?' },
];

const meta = {
    title: 'Navigation/Stepper',
    component: Stepper,
    args: { items, linear: true },
    argTypes: { items: { control: false } },
    render: (args) => ({
        components: { Field, Input, Stepper },
        setup: () => ({ args, step: ref(0), name: ref(''), project: ref('') }),
        template: `
            <div class="flex max-w-xl flex-col gap-3">
                <Stepper v-bind="args" v-model:step="step" :is-step-valid="(index) => index !== 0 || name.trim() !== ''">
                    <template #step="{ index }">
                        <Field v-if="index === 0" label="Name" required helper-text="Required – you can only continue once it is filled in">
                            <Input v-model="name" />
                        </Field>
                        <Field v-else-if="index === 1" label="Project"><Input v-model="project" /></Field>
                        <p v-else class="text-sm">{{ name }} is planning: {{ project || '–' }}</p>
                    </template>
                    <template #completed>
                        <p class="text-sm">Thanks, we will get back to you.</p>
                    </template>
                </Stepper>
                <span class="text-xs text-muted">Step: {{ step + 1 }}</span>
            </div>`,
    }),
} satisfies Meta<typeof Stepper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Steps beside the content, labels below the numbers; the second step is still saving */
export const Vertical: Story = {
    render: () => ({
        components: { Stepper },
        setup: () => ({
            steps: [
                { label: 'Contact', description: 'Who are you?' },
                { label: 'Project', description: 'Saving …', loading: true },
                { label: 'Review' },
            ],
        }),
        template: `
            <Stepper :items="steps" :default-step="1" orientation="vertical" class="max-w-xl">
                <template #step="{ index }"><p class="text-sm">Content of step {{ index + 1 }}</p></template>
            </Stepper>`,
    }),
};

export const LabelBelow: Story = {
    render: () => ({
        components: { Stepper },
        setup: () => ({ items }),
        template: `
            <Stepper :items="items" :default-step="1" label-placement="bottom" class="max-w-xl">
                <template #step="{ index }"><p class="text-sm">Content of step {{ index + 1 }}</p></template>
            </Stepper>`,
    }),
};
