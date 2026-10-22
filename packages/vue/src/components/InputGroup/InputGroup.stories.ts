import { Search } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Button from '../Button/Button.vue';
import Field from '../Field/Field.vue';
import Input from '../Input/Input.vue';
import InputGroup from './InputGroup.vue';
import InputGroupAddon from './InputGroupAddon.vue';

const meta = {
    title: 'Forms/InputGroup',
    component: InputGroup,
    render: () => ({
        components: { Button, Field, Input, InputGroup, InputGroupAddon },
        setup: () => ({ Search }),
        template: `
            <div class="flex w-96 flex-col gap-5">
                <Field label="Domain">
                    <InputGroup>
                        <InputGroupAddon>https://</InputGroupAddon>
                        <Input placeholder="example" />
                        <InputGroupAddon>.com</InputGroupAddon>
                    </InputGroup>
                </Field>
                <Field label="Search servers">
                    <InputGroup>
                        <Input :leading-icon="Search" type="search" />
                        <Button variant="outline">Search</Button>
                    </InputGroup>
                </Field>
                <Field label="Budget">
                    <InputGroup>
                        <Input inputmode="decimal" />
                        <InputGroupAddon>€ / month</InputGroupAddon>
                    </InputGroup>
                </Field>
            </div>`,
    }),
} satisfies Meta<typeof InputGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
