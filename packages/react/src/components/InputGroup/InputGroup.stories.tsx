import type { Meta, StoryObj } from '@storybook/react-vite';
import { Search } from 'lucide-react';
import { Button } from '../Button/Button.js';
import { Field } from '../Field/Field.js';
import { Input } from '../Input/Input.js';
import { InputGroup, InputGroupAddon } from './InputGroup.js';

const meta = {
    title: 'Forms/InputGroup',
    component: InputGroup,
    args: { children: null },
    argTypes: { children: { control: false } },
    render: () => (
        <div className="flex w-96 flex-col gap-5">
            <Field label="Domain">
                <InputGroup>
                    <InputGroupAddon>https://</InputGroupAddon>
                    <Input placeholder="example" />
                    <InputGroupAddon>.com</InputGroupAddon>
                </InputGroup>
            </Field>
            <Field label="Search servers">
                <InputGroup>
                    <Input leadingIcon={Search} type="search" />
                    <Button variant="outline">Search</Button>
                </InputGroup>
            </Field>
            <Field label="Budget">
                <InputGroup>
                    <Input inputMode="decimal" />
                    <InputGroupAddon>€ / month</InputGroupAddon>
                </InputGroup>
            </Field>
        </div>
    ),
} satisfies Meta<typeof InputGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
