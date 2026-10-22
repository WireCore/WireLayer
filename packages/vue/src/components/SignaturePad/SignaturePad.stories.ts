import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Field from '../Field/Field.vue';
import SignaturePad from './SignaturePad.vue';

const meta = {
    title: 'Forms/SignaturePad',
    component: SignaturePad,
    args: { typedAlternative: true, format: 'png', disabled: false },
    argTypes: { format: { control: 'inline-radio', options: ['png', 'svg'] } },
    render: (args) => ({
        components: { Field, SignaturePad },
        setup: () => ({ args, value: ref('') }),
        template: `
            <div class="flex w-96 flex-col gap-3">
                <Field label="Client signature" helper-text="With mouse, pen or finger – or type the name">
                    <SignaturePad v-bind="args" v-model="value" />
                </Field>
                <img v-if="value" :src="value" alt="Signature preview" class="h-16 self-start rounded border border-line bg-white" />
            </div>`,
    }),
} satisfies Meta<typeof SignaturePad>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Draw, undo the last stroke, clear – or type the name instead (accessible alternative) */
export const Playground: Story = {};

/** As SVG, with its own label and a thicker blue pen */
export const AsSvg: Story = {
    name: 'As SVG',
    render: () => ({
        components: { SignaturePad },
        setup: () => ({ value: ref('') }),
        template: `
            <div class="flex w-96 flex-col gap-3">
                <SignaturePad v-model="value" label="Signature" format="svg" color="#1e3a8a" :stroke-width="3" />
                <span class="truncate font-mono text-xs text-muted">{{ value ? value.slice(0, 60) + '…' : 'empty' }}</span>
            </div>`,
    }),
};
