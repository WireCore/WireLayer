import { ArrowRight, ArrowUpRight, Bell, Check, Download, Plus, Trash2 } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Button from './Button.vue';

const meta = {
    title: 'Buttons/Button',
    component: Button,
    args: { variant: 'primary', size: 'md', loading: false, disabled: false },
    argTypes: {
        variant: {
            control: 'select',
            options: ['primary', 'secondary', 'success', 'info', 'warn', 'danger', 'outline', 'text', 'soft', 'link'],
        },
        color: {
            control: 'select',
            options: [undefined, 'primary', 'secondary', 'success', 'info', 'warn', 'danger', 'contrast'],
        },
        size: { control: 'inline-radio', options: ['xs', 'sm', 'md', 'lg'] },
        shape: { control: 'inline-radio', options: ['pill', 'rounded', 'square'] },
        leadingIcon: { control: false },
        trailingIcon: { control: false },
    },
    render: (args) => ({
        components: { Button },
        setup: () => ({ args, ArrowRight }),
        template: '<Button v-bind="args" :trailing-icon="ArrowRight">Start project</Button>',
    }),
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
    render: () => ({
        components: { Button, ArrowUpRight },
        setup: () => ({ ArrowRight, Check, Download, Trash2 }),
        template: `
            <div class="flex flex-wrap items-center gap-2">
                <Button :trailing-icon="ArrowRight">Start project</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="success" :leading-icon="Check">Save</Button>
                <Button variant="info">Info</Button>
                <Button variant="warn">Warning</Button>
                <Button variant="danger" :leading-icon="Trash2">Delete</Button>
                <Button variant="outline">View services</Button>
                <Button variant="soft">Tinted</Button>
                <Button variant="text" :leading-icon="Download">Text</Button>
                <Button variant="link" as-child>
                    <a href="#">Link<ArrowUpRight class="size-3.5" aria-hidden="true" /></a>
                </Button>
            </div>`,
    }),
};

export const Sizes: Story = {
    render: () => ({
        components: { Button },
        setup: () => ({ ArrowRight }),
        template: `
            <div class="flex flex-wrap items-center gap-2">
                <Button size="xs" :trailing-icon="ArrowRight">Extra small</Button>
                <Button size="sm" :trailing-icon="ArrowRight">Small</Button>
                <Button size="md" :trailing-icon="ArrowRight">Default</Button>
                <Button size="lg" :trailing-icon="ArrowRight">Large</Button>
            </div>`,
    }),
};

export const States: Story = {
    render: () => ({
        components: { Button },
        setup() {
            const loading = ref(false);
            const send = () => {
                loading.value = true;
                setTimeout(() => (loading.value = false), 1800);
            };
            return { loading, send };
        },
        template: `
            <div class="flex flex-wrap items-center gap-2">
                <Button class="min-w-[150px]" :loading="loading" @click="send">
                    {{ loading ? 'Sending' : 'Send request' }}
                </Button>
                <Button disabled>Disabled</Button>
            </div>`,
    }),
};

const colors = ['primary', 'secondary', 'success', 'info', 'warn', 'danger', 'contrast'] as const;
const colorNames = {
    primary: 'Primary',
    secondary: 'Secondary',
    success: 'Success',
    info: 'Info',
    warn: 'Warning',
    danger: 'Danger',
    contrast: 'Contrast',
};

/** `color` combined with a style: filled (default), outline, soft, text and link – e.g. danger as a text button */
export const ColorsAndStyles: Story = {
    render: () => ({
        components: { Button },
        setup: () => ({ colors, colorNames, styles: ['primary', 'outline', 'soft', 'text', 'link'] }),
        template: `
            <div class="flex flex-col gap-3">
                <div v-for="style in styles" :key="style" class="flex flex-wrap items-center gap-2">
                    <Button v-for="color in colors" :key="color" :variant="style" :color="color">
                        {{ colorNames[color] }}
                    </Button>
                </div>
            </div>`,
    }),
};

export const Shapes: Story = {
    render: () => ({
        components: { Button },
        setup: () => ({ Plus }),
        template: `
            <div class="flex flex-wrap items-center gap-2">
                <Button :leading-icon="Plus">Pill</Button>
                <Button shape="rounded" :leading-icon="Plus">Rounded</Button>
                <Button shape="square" :leading-icon="Plus">Square</Button>
            </div>`,
    }),
};

/** Counter or dot after the label – part of the accessible name ("Notifications 4 new") */
export const Badges: Story = {
    render: () => ({
        components: { Button },
        setup: () => ({ Bell }),
        template: `
            <div class="flex flex-wrap items-center gap-2">
                <Button variant="outline" :leading-icon="Bell" :badge="4">Notifications</Button>
                <Button variant="text" badge>Inbox</Button>
            </div>`,
    }),
};

export const Block: Story = {
    render: () => ({
        components: { Button },
        template: `
            <div class="flex max-w-sm flex-col gap-2">
                <Button block>Sign in</Button>
                <Button block variant="outline">Create account</Button>
            </div>`,
    }),
};
