import type { Meta, StoryObj } from '@storybook/react-vite';
import { CodeXml, Server } from 'lucide-react';
import { Steps } from './Steps.js';

const meta = {
    title: 'Navigation/Steps',
    component: Steps,
    args: {
        items: [{ label: 'Understand' }, { label: 'Build', icon: CodeXml }, { label: 'Operate', icon: Server }],
        current: 1,
        label: 'Project flow',
        className: 'w-[380px]',
    },
    argTypes: {
        items: { control: false },
        current: { control: { type: 'range', min: 0, max: 3 } },
    },
} satisfies Meta<typeof Steps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
