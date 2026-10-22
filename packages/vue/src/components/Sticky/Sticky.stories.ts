import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Button from '../Button/Button.vue';
import Field from '../Field/Field.vue';
import Input from '../Input/Input.vue';
import Sticky from './Sticky.vue';

const fields = ['Company', 'Street', 'ZIP code', 'City', 'Country', 'Contact person', 'Email', 'Phone'];

const meta = {
    title: 'Layout/Sticky',
    component: Sticky,
    render: () => ({
        components: { Button, Field, Input, Sticky },
        setup: () => ({ fields }),
        template: `
            <div class="h-80 max-w-md overflow-y-auto rounded-xl border border-line">
                <Sticky class="border-b border-line bg-card px-4 py-3 text-sm font-semibold">Customer details</Sticky>
                <form class="flex flex-col gap-4 p-4" @submit.prevent>
                    <Field v-for="field in fields" :key="field" :label="field"><Input /></Field>
                </form>
                <Sticky edge="bottom" bar>
                    <Button variant="outline">Cancel</Button>
                    <Button>Save</Button>
                </Sticky>
            </div>`,
    }),
} satisfies Meta<typeof Sticky>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A heading that sticks to the top and an action bar at the bottom of a long form */
export const Playground: Story = {};
