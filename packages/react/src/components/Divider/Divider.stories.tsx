import type { Meta, StoryObj } from '@storybook/react-vite';
import { Divider } from './Divider.js';

const meta = {
    title: 'Layout/Divider',
    component: Divider,
    args: { orientation: 'horizontal', label: '' },
    argTypes: { orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] } },
    render: (args) => (
        <div className="flex h-24 w-80 items-center justify-center">
            <Divider {...args} />
        </div>
    ),
} satisfies Meta<typeof Divider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Overview: Story = {
    render: () => (
        <div className="flex w-80 flex-col gap-5 text-sm text-fg">
            <span>Sign in with email</span>
            <Divider label="or" />
            <span>Sign in with single sign-on</span>
            <Divider />
            <div className="flex h-6 items-center gap-3">
                <span>Hosting</span>
                <Divider orientation="vertical" />
                <span>Cloud</span>
            </div>
        </div>
    ),
};

/** Label at the start or end, dashed and dotted lines */
export const Variants: Story = {
    render: () => (
        <div className="flex w-80 flex-col gap-5 text-sm text-fg">
            <Divider label="Details" labelPosition="start" />
            <Divider label="End" labelPosition="end" lineStyle="dashed" />
            <Divider lineStyle="dashed" />
            <Divider label="or" lineStyle="dotted" />
        </div>
    ),
};
