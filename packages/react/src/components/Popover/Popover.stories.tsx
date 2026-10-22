import type { Meta, StoryObj } from '@storybook/react-vite';
import type { OverlayHandle } from '@wirecore/wirelayer-recipes';
import { Info } from 'lucide-react';
import { useRef } from 'react';
import { Button } from '../Button/Button.js';
import { IconButton } from '../IconButton/IconButton.js';
import { Progress } from '../Progress/Progress.js';
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from './Popover.js';

const meta = {
    title: 'Overlays/Popover',
    component: Popover,
    args: { placement: 'bottom', children: null },
    argTypes: {
        placement: { control: 'select', options: ['top', 'bottom', 'left', 'right', 'bottom-start', 'bottom-end'] },
        children: { control: false },
    },
    render: (args) => (
        <Popover placement={args.placement}>
            <PopoverTrigger>
                <IconButton icon={Info} label="Details for web-01" />
            </PopoverTrigger>
            <PopoverContent title="web-01" description="Frankfurt · Ubuntu 26.04 · 8 vCPU">
                <Progress value={42} label="CPU" />
                <Progress value={71} label="Memory" />
                <PopoverClose>
                    <Button size="sm" variant="outline" className="self-start">
                        Close
                    </Button>
                </PopoverClose>
            </PopoverContent>
        </Popover>
    ),
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** As wide as its trigger (`width="trigger"`), with a dimmed page behind it and the focus kept inside (`trapFocus`) */
export const TriggerWidthAndOverlay: Story = {
    render: () => (
        <Popover width="trigger" overlay trapFocus>
            <PopoverTrigger>
                <Button variant="outline" className="w-80">
                    Choose location
                </Button>
            </PopoverTrigger>
            <PopoverContent title="Location" description="Applies to all new servers.">
                <PopoverClose>
                    <Button size="sm">Frankfurt</Button>
                </PopoverClose>
                <PopoverClose>
                    <Button size="sm" variant="outline">
                        Nuremberg
                    </Button>
                </PopoverClose>
            </PopoverContent>
        </Popover>
    ),
};

function OpenAtAnchorDemo() {
    const popover = useRef<OverlayHandle>(null);
    return (
        <div className="flex gap-2">
            {['web-01', 'web-02', 'db-primary'].map((name) => (
                <Button key={name} variant="outline" onClick={(event) => popover.current?.open(event.currentTarget)}>
                    {name}
                </Button>
            ))}
            <Popover ref={popover} placement="bottom-start">
                <PopoverContent title="Server" description="Frankfurt · Ubuntu 26.04" />
            </Popover>
        </div>
    );
}

/**
 * Without a trigger: opened from code at any element (`popover.open(element)`, ref) – e.g. at a cell of a table.
 * The focus returns to where it was.
 */
export const OpenAtAnchor: Story = { render: () => <OpenAtAnchorDemo /> };
