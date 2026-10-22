import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../Button/Button.js';
import { Field } from '../Field/Field.js';
import { Input } from '../Input/Input.js';
import { Sticky } from './Sticky.js';

const fields = ['Company', 'Street', 'ZIP code', 'City', 'Country', 'Contact person', 'Email', 'Phone'];

const meta = {
    title: 'Layout/Sticky',
    component: Sticky,
    render: () => (
        <div className="h-80 max-w-md overflow-y-auto rounded-xl border border-line">
            <Sticky className="border-b border-line bg-card px-4 py-3 text-sm font-semibold">Customer details</Sticky>
            <form className="flex flex-col gap-4 p-4" onSubmit={(event) => event.preventDefault()}>
                {fields.map((field) => (
                    <Field key={field} label={field}>
                        <Input />
                    </Field>
                ))}
            </form>
            <Sticky edge="bottom" bar>
                <Button variant="outline">Cancel</Button>
                <Button>Save</Button>
            </Sticky>
        </div>
    ),
} satisfies Meta<typeof Sticky>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A heading that sticks to the top and an action bar at the bottom of a long form */
export const Playground: Story = {};
