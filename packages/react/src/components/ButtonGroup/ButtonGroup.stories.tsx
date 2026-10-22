import type { Meta, StoryObj } from '@storybook/react-vite';
import { AlignCenter, AlignLeft, AlignRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../Button/Button.js';
import { IconButton } from '../IconButton/IconButton.js';
import { ButtonGroup } from './ButtonGroup.js';

const meta = {
    title: 'Buttons/ButtonGroup',
    component: ButtonGroup,
    args: {
        label: 'View',
        orientation: 'horizontal',
        block: false,
        children: (
            <>
                <Button variant="outline">Day</Button>
                <Button variant="outline">Week</Button>
                <Button variant="outline">Month</Button>
            </>
        ),
    },
    argTypes: {
        orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
        children: { control: false },
    },
} satisfies Meta<typeof ButtonGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Filled, tinted and icon buttons; shape "rounded" keeps the outer corners slightly round */
export const Styles: Story = {
    render: () => (
        <div className="flex flex-col items-start gap-3">
            <ButtonGroup label="Save">
                <Button>Save</Button>
                <Button variant="secondary">Discard</Button>
            </ButtonGroup>
            <ButtonGroup label="Alignment">
                <IconButton icon={AlignLeft} label="Left" shape="rounded" />
                <IconButton icon={AlignCenter} label="Center" shape="rounded" />
                <IconButton icon={AlignRight} label="Right" shape="rounded" />
            </ButtonGroup>
            <ButtonGroup label="Period" block>
                <Button variant="soft" shape="rounded">
                    Today
                </Button>
                <Button variant="soft" shape="rounded">
                    7 days
                </Button>
                <Button variant="soft" shape="rounded">
                    30 days
                </Button>
            </ButtonGroup>
        </div>
    ),
};

export const Vertical: Story = {
    render: () => (
        <ButtonGroup label="Order" orientation="vertical">
            <IconButton icon={ChevronUp} label="Move up" shape="rounded" />
            <IconButton icon={ChevronDown} label="Move down" shape="rounded" />
        </ButtonGroup>
    ),
};
