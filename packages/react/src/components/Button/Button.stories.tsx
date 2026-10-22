import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArrowRight, ArrowUpRight, Bell, Check, Download, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from './Button.js';

const meta = {
    title: 'Buttons/Button',
    component: Button,
    args: {
        variant: 'primary',
        size: 'md',
        loading: false,
        disabled: false,
        trailingIcon: ArrowRight,
        children: 'Start project',
    },
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
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
    render: () => (
        <div className="flex flex-wrap items-center gap-2">
            <Button trailingIcon={ArrowRight}>Start project</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="success" leadingIcon={Check}>
                Save
            </Button>
            <Button variant="info">Info</Button>
            <Button variant="warn">Warning</Button>
            <Button variant="danger" leadingIcon={Trash2}>
                Delete
            </Button>
            <Button variant="outline">View services</Button>
            <Button variant="soft">Tinted</Button>
            <Button variant="text" leadingIcon={Download}>
                Text
            </Button>
            <Button variant="link" asChild>
                <a href="#">
                    Link
                    <ArrowUpRight className="size-3.5" aria-hidden="true" />
                </a>
            </Button>
        </div>
    ),
};

export const Sizes: Story = {
    render: () => (
        <div className="flex flex-wrap items-center gap-2">
            <Button size="xs" trailingIcon={ArrowRight}>
                Extra small
            </Button>
            <Button size="sm" trailingIcon={ArrowRight}>
                Small
            </Button>
            <Button size="md" trailingIcon={ArrowRight}>
                Default
            </Button>
            <Button size="lg" trailingIcon={ArrowRight}>
                Large
            </Button>
        </div>
    ),
};

function StatesDemo() {
    const [loading, setLoading] = useState(false);
    const send = () => {
        setLoading(true);
        setTimeout(() => setLoading(false), 1800);
    };

    return (
        <div className="flex flex-wrap items-center gap-2">
            <Button className="min-w-[150px]" loading={loading} onClick={send}>
                {loading ? 'Sending' : 'Send request'}
            </Button>
            <Button disabled>Disabled</Button>
        </div>
    );
}

export const States: Story = {
    render: () => <StatesDemo />,
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
    render: () => (
        <div className="flex flex-col gap-3">
            {(['primary', 'outline', 'soft', 'text', 'link'] as const).map((style) => (
                <div key={style} className="flex flex-wrap items-center gap-2">
                    {colors.map((color) => (
                        <Button key={color} variant={style} color={color}>
                            {colorNames[color]}
                        </Button>
                    ))}
                </div>
            ))}
        </div>
    ),
};

export const Shapes: Story = {
    render: () => (
        <div className="flex flex-wrap items-center gap-2">
            <Button leadingIcon={Plus}>Pill</Button>
            <Button shape="rounded" leadingIcon={Plus}>
                Rounded
            </Button>
            <Button shape="square" leadingIcon={Plus}>
                Square
            </Button>
        </div>
    ),
};

/** Counter or dot after the label – part of the accessible name ("Notifications 4 new") */
export const Badges: Story = {
    render: () => (
        <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" leadingIcon={Bell} badge={4}>
                Notifications
            </Button>
            <Button variant="text" badge>
                Inbox
            </Button>
        </div>
    ),
};

export const Block: Story = {
    render: () => (
        <div className="flex max-w-sm flex-col gap-2">
            <Button block>Sign in</Button>
            <Button block variant="outline">
                Create account
            </Button>
        </div>
    ),
};
