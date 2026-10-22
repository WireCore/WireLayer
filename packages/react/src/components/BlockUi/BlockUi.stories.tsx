import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../Button/Button.js';
import { Field } from '../Field/Field.js';
import { Input } from '../Input/Input.js';
import { BlockUi } from './BlockUi.js';

const meta = {
    title: 'Layout/BlockUi',
    component: BlockUi,
    args: {
        blocked: true,
        label: 'Saving',
        className: 'w-80 rounded-xl border border-line p-5',
        children: (
            <div className="flex flex-col gap-4">
                <Field label="Company">
                    <Input defaultValue="Acme Inc." />
                </Field>
                <Button>Save</Button>
            </div>
        ),
    },
    argTypes: { children: { control: false } },
} satisfies Meta<typeof BlockUi>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
