import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, Underline } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Button from '../Button/Button.vue';
import ButtonGroup from '../ButtonGroup/ButtonGroup.vue';
import Divider from '../Divider/Divider.vue';
import IconButton from '../IconButton/IconButton.vue';
import ToggleButton from '../ToggleButton/ToggleButton.vue';
import Toolbar from './Toolbar.vue';

const meta = {
    title: 'Layout/Toolbar',
    component: Toolbar,
    args: { label: 'Formatting', orientation: 'horizontal' },
    argTypes: { orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] } },
    render: (args) => ({
        components: { Divider, IconButton, ToggleButton, Toolbar },
        setup: () => ({ args, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight }),
        template: `
            <Toolbar v-bind="args" class="w-fit">
                <ToggleButton :icon="Bold" size="sm">Bold</ToggleButton>
                <ToggleButton :icon="Italic" size="sm">Italic</ToggleButton>
                <ToggleButton :icon="Underline" size="sm">Underline</ToggleButton>
                <Divider :orientation="args.orientation === 'horizontal' ? 'vertical' : 'horizontal'" class="mx-1 self-stretch" />
                <IconButton :icon="AlignLeft" label="Left" variant="text" size="sm" />
                <IconButton :icon="AlignCenter" label="Center" variant="text" size="sm" />
                <IconButton :icon="AlignRight" label="Right" variant="text" size="sm" />
            </Toolbar>`,
    }),
} satisfies Meta<typeof Toolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Start, center and end areas – still one tab stop; the alignment buttons form a group of toggles */
export const Regions: Story = {
    render: () => ({
        components: { Button, ButtonGroup, ToggleButton, Toolbar },
        setup: () => ({ Bold, Italic, AlignLeft, AlignCenter, AlignRight }),
        template: `
            <Toolbar label="Editor" class="w-[40rem]">
                <template #start>
                    <ToggleButton :icon="Bold" size="sm">Bold</ToggleButton>
                    <ToggleButton :icon="Italic" size="sm">Italic</ToggleButton>
                </template>
                <template #center>
                    <ButtonGroup label="Alignment">
                        <ToggleButton :icon="AlignLeft" size="sm" default-pressed>Left</ToggleButton>
                        <ToggleButton :icon="AlignCenter" size="sm">Center</ToggleButton>
                        <ToggleButton :icon="AlignRight" size="sm">Right</ToggleButton>
                    </ButtonGroup>
                </template>
                <template #end><Button size="sm">Save</Button></template>
            </Toolbar>`,
    }),
};
