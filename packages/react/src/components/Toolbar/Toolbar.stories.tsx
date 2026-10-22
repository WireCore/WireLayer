import type { Meta, StoryObj } from '@storybook/react-vite';
import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, Underline } from 'lucide-react';
import { Button } from '../Button/Button.js';
import { ButtonGroup } from '../ButtonGroup/ButtonGroup.js';
import { Divider } from '../Divider/Divider.js';
import { IconButton } from '../IconButton/IconButton.js';
import { ToggleButton } from '../ToggleButton/ToggleButton.js';
import { Toolbar } from './Toolbar.js';

const meta = {
    title: 'Layout/Toolbar',
    component: Toolbar,
    args: { label: 'Formatting', orientation: 'horizontal', children: null },
    argTypes: {
        orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
        children: { control: false },
    },
    render: (args) => (
        <Toolbar label={args.label} orientation={args.orientation} className="w-fit">
            <ToggleButton icon={Bold} size="sm">
                Bold
            </ToggleButton>
            <ToggleButton icon={Italic} size="sm">
                Italic
            </ToggleButton>
            <ToggleButton icon={Underline} size="sm">
                Underline
            </ToggleButton>
            <Divider
                orientation={args.orientation === 'horizontal' ? 'vertical' : 'horizontal'}
                className="mx-1 self-stretch"
            />
            <IconButton icon={AlignLeft} label="Left" variant="text" size="sm" />
            <IconButton icon={AlignCenter} label="Center" variant="text" size="sm" />
            <IconButton icon={AlignRight} label="Right" variant="text" size="sm" />
        </Toolbar>
    ),
} satisfies Meta<typeof Toolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Start, center and end areas – still one tab stop; the alignment buttons form a group of toggles */
export const Regions: Story = {
    render: () => (
        <Toolbar
            label="Editor"
            className="w-[40rem]"
            start={
                <>
                    <ToggleButton icon={Bold} size="sm">
                        Bold
                    </ToggleButton>
                    <ToggleButton icon={Italic} size="sm">
                        Italic
                    </ToggleButton>
                </>
            }
            center={
                <ButtonGroup label="Alignment">
                    <ToggleButton icon={AlignLeft} size="sm" defaultPressed>
                        Left
                    </ToggleButton>
                    <ToggleButton icon={AlignCenter} size="sm">
                        Center
                    </ToggleButton>
                    <ToggleButton icon={AlignRight} size="sm">
                        Right
                    </ToggleButton>
                </ButtonGroup>
            }
            end={<Button size="sm">Save</Button>}
        />
    ),
};
