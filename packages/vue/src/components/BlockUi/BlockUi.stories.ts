import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Button from '../Button/Button.vue';
import Field from '../Field/Field.vue';
import Input from '../Input/Input.vue';
import BlockUi from './BlockUi.vue';

const meta = {
    title: 'Layout/BlockUi',
    component: BlockUi,
    args: { blocked: true, label: 'Saving' },
    render: (args) => ({
        components: { BlockUi, Button, Field, Input },
        setup: () => ({ args }),
        template: `
            <BlockUi v-bind="args" class="w-80 rounded-xl border border-line p-5">
                <div class="flex flex-col gap-4">
                    <Field label="Company"><Input model-value="Acme Inc." /></Field>
                    <Button>Save</Button>
                </div>
            </BlockUi>`,
    }),
} satisfies Meta<typeof BlockUi>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
