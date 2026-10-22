import type { Meta, StoryObj } from '@storybook/react-vite';
import type { DrawerPlacement, OverlaySize } from '@wirecore/wirelayer-recipes';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '../Button/Button.js';
import { Checkbox } from '../Checkbox/Checkbox.js';
import { Field } from '../Field/Field.js';
import { Input } from '../Input/Input.js';
import { Drawer, DrawerClose, DrawerContent, DrawerTrigger } from './Drawer.js';

function FilterDrawer({
    placement,
    size,
    offset,
    modal,
}: {
    placement: DrawerPlacement;
    size?: OverlaySize;
    offset?: boolean;
    modal?: boolean;
}) {
    return (
        <Drawer modal={modal}>
            <DrawerTrigger>
                <Button variant="outline" leadingIcon={SlidersHorizontal}>
                    Filter
                </Button>
            </DrawerTrigger>
            <DrawerContent
                title="Filter"
                description="Narrow down servers by location and status"
                placement={placement}
                size={size}
                offset={offset}
                footer={
                    <>
                        <DrawerClose>
                            <Button variant="outline" size="sm">
                                Reset
                            </Button>
                        </DrawerClose>
                        <DrawerClose>
                            <Button size="sm">Apply</Button>
                        </DrawerClose>
                    </>
                }
            >
                <Field label="Name">
                    <Input placeholder="e.g. web-01" />
                </Field>
                <Checkbox defaultChecked>Frankfurt</Checkbox>
                <Checkbox>Nuremberg</Checkbox>
                <Checkbox>Only servers with warnings</Checkbox>
            </DrawerContent>
        </Drawer>
    );
}

const meta = {
    title: 'Overlays/Drawer',
    component: FilterDrawer,
    args: { placement: 'right' },
    argTypes: {
        placement: { control: 'inline-radio', options: ['right', 'left', 'bottom', 'top'] },
        size: { control: 'inline-radio', options: ['sm', 'md', 'lg', 'xl', 'full'] },
    },
} satisfies Meta<typeof FilterDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Floating with a gap to the screen edge (`offset`), narrow (`size="sm"`) */
export const Floating: Story = { args: { offset: true, size: 'sm' } };

/** Non-modal: no backdrop, the page stays usable while the panel is open */
export const NonModal: Story = { args: { modal: false, placement: 'bottom', size: 'sm' } };
