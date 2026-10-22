import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../Button/Button.js';
import { Field } from '../Field/Field.js';
import { Input } from '../Input/Input.js';
import { PasswordInput } from '../PasswordInput/PasswordInput.js';
import { ConfigProvider } from './ConfigProvider.js';

const meta = {
    title: 'Layout/ConfigProvider',
    component: ConfigProvider,
    args: { size: 'sm', theme: 'ocean', mode: 'dark', locale: 'en-US' },
    argTypes: {
        size: { control: 'inline-radio', options: ['xs', 'sm', 'md', 'lg'] },
        theme: { control: 'select', options: ['wirecore', 'ocean', 'violet', 'teal'] },
        mode: { control: 'inline-radio', options: ['light', 'dark'] },
        locale: { control: 'select', options: ['de-DE', 'en-US', 'he-IL'] },
    },
    render: (args) => (
        <div className="flex flex-col gap-4">
            <ConfigProvider {...args} className="flex w-80 flex-col gap-3 rounded-xl bg-bg p-4">
                <Field label="Name">
                    <Input />
                </Field>
                <Field label="Password">
                    <PasswordInput />
                </Field>
                <Button className="self-start">Save</Button>
            </ConfigProvider>
            <Button variant="outline" className="self-start">
                Outside: default size
            </Button>
        </div>
    ),
} satisfies Meta<typeof ConfigProvider>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * One provider for a part of the page: size (density) of every component, language, color theme and mode – a thin
 * wrapper around LocaleProvider and RecipesProvider
 */
export const Playground: Story = {};
