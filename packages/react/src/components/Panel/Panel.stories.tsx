import type { Meta, StoryObj } from '@storybook/react-vite';
import { Pencil } from 'lucide-react';
import { Button } from '../Button/Button.js';
import { IconButton } from '../IconButton/IconButton.js';
import { Panel } from './Panel.js';

const meta = {
    title: 'Layout/Panel',
    component: Panel,
    args: { title: 'Contract details', toggleable: false, headingLevel: 3, children: null },
    argTypes: { children: { control: false } },
    render: (args) => (
        <Panel
            {...args}
            className="max-w-lg"
            actions={<IconButton icon={Pencil} label="Edit contract details" variant="text" size="sm" />}
            footer={
                <Button size="sm" variant="outline">
                    Download contract
                </Button>
            }
        >
            24-month term, renewing for 12 months at a time, three months' notice to cancel.
        </Panel>
    ),
} satisfies Meta<typeof Panel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Toggleable: Story = { args: { toggleable: true } };
