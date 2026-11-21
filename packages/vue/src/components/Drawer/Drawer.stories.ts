import { Hexagon, Menu as MenuIcon, SlidersHorizontal } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Button from '../Button/Button.vue';
import Checkbox from '../Checkbox/Checkbox.vue';
import Field from '../Field/Field.vue';
import Input from '../Input/Input.vue';
import Drawer from './Drawer.vue';
import DrawerClose from './DrawerClose.vue';
import DrawerContent from './DrawerContent.vue';
import DrawerTrigger from './DrawerTrigger.vue';

const meta = {
    title: 'Overlays/Drawer',
    component: Drawer,
    args: { placement: 'right' },
    argTypes: {
        placement: { control: 'inline-radio', options: ['right', 'left', 'bottom', 'top'] },
        size: { control: 'inline-radio', options: ['sm', 'md', 'lg', 'xl', 'full'] },
    },
    render: (args) => ({
        components: { Button, Checkbox, Drawer, DrawerClose, DrawerContent, DrawerTrigger, Field, Input },
        setup: () => ({ args, SlidersHorizontal }),
        template: `
            <Drawer :modal="args.modal ?? true">
                <DrawerTrigger><Button variant="outline" :leading-icon="SlidersHorizontal">Filter</Button></DrawerTrigger>
                <DrawerContent title="Filter" description="Narrow down servers by location and status" :placement="args.placement" :size="args.size" :offset="args.offset">
                    <Field label="Name"><Input placeholder="e.g. web-01" /></Field>
                    <Checkbox default-checked>Frankfurt</Checkbox>
                    <Checkbox>Nuremberg</Checkbox>
                    <Checkbox>Only servers with warnings</Checkbox>
                    <template #footer>
                        <DrawerClose><Button variant="outline" size="sm">Reset</Button></DrawerClose>
                        <DrawerClose><Button size="sm">Apply</Button></DrawerClose>
                    </template>
                </DrawerContent>
            </Drawer>`,
    }),
} satisfies Meta;

export default meta;
// The args belong to DrawerContent (placement, size, offset) and Drawer (modal)
type Story = StoryObj;

export const Playground: Story = {};

/** Floating with a gap to the screen edge (`offset`), narrow (`size="sm"`) */
export const Floating: Story = { args: { offset: true, size: 'sm' } };

/** Non-modal: no backdrop, the page stays usable while the panel is open */
export const NonModal: Story = { args: { modal: false, placement: 'bottom', size: 'sm' } };

/**
 * Navigation from the left with the logo of the app next to the close button (`#header`). The title names the drawer
 * for screen readers only – with the slot that is the default (`hide-title`)
 */
export const LogoInHeader: Story = {
    render: () => ({
        components: { Button, Drawer, DrawerContent, DrawerTrigger },
        setup: () => ({ Hexagon, MenuIcon }),
        template: `
            <Drawer>
                <DrawerTrigger><Button variant="outline" :leading-icon="MenuIcon">Menu</Button></DrawerTrigger>
                <DrawerContent title="Menu" placement="left" size="sm" hide-title closable>
                    <template #header>
                        <span class="flex items-center gap-2 font-semibold">
                            <component :is="Hexagon" class="size-6 text-primary" aria-hidden="true" />
                            Acme
                        </span>
                    </template>
                    <nav aria-label="Main" class="flex flex-col gap-1">
                        <a href="#" aria-current="page">Dashboard</a>
                        <a href="#">Servers</a>
                        <a href="#">Invoices</a>
                    </nav>
                </DrawerContent>
            </Drawer>`,
    }),
};
