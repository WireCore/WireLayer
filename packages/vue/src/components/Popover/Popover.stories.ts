import { Info } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Button from '../Button/Button.vue';
import IconButton from '../IconButton/IconButton.vue';
import Progress from '../Progress/Progress.vue';
import Popover from './Popover.vue';
import PopoverClose from './PopoverClose.vue';
import PopoverContent from './PopoverContent.vue';
import PopoverTrigger from './PopoverTrigger.vue';

const meta = {
    title: 'Overlays/Popover',
    component: Popover,
    args: { placement: 'bottom' },
    argTypes: {
        placement: { control: 'select', options: ['top', 'bottom', 'left', 'right', 'bottom-start', 'bottom-end'] },
    },
    render: (args) => ({
        components: { Button, IconButton, Popover, PopoverClose, PopoverContent, PopoverTrigger, Progress },
        setup: () => ({ args, Info }),
        template: `
            <Popover v-bind="args">
                <PopoverTrigger><IconButton :icon="Info" label="Details for web-01" /></PopoverTrigger>
                <PopoverContent title="web-01" description="Frankfurt · Ubuntu 26.04 · 8 vCPU">
                    <Progress :value="42" label="CPU" />
                    <Progress :value="71" label="Memory" />
                    <PopoverClose><Button size="sm" variant="outline" class="self-start">Close</Button></PopoverClose>
                </PopoverContent>
            </Popover>`,
    }),
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** As wide as its trigger (`width="trigger"`), with a dimmed page behind it and the focus kept inside (`trap-focus`) */
export const TriggerWidthAndOverlay: Story = {
    render: () => ({
        components: { Button, Popover, PopoverClose, PopoverContent, PopoverTrigger },
        template: `
            <Popover width="trigger" overlay trap-focus>
                <PopoverTrigger><Button variant="outline" class="w-80">Choose location</Button></PopoverTrigger>
                <PopoverContent title="Location" description="Applies to all new servers.">
                    <PopoverClose><Button size="sm">Frankfurt</Button></PopoverClose>
                    <PopoverClose><Button size="sm" variant="outline">Nuremberg</Button></PopoverClose>
                </PopoverContent>
            </Popover>`,
    }),
};

/**
 * Without a trigger: opened from code at any element (`popover.open(element)`, template ref) – e.g. at a cell of a
 * table. The focus returns to where it was.
 */
export const OpenAtAnchor: Story = {
    render: () => ({
        components: { Button, Popover, PopoverContent },
        setup: () => ({ popover: ref<InstanceType<typeof Popover> | null>(null) }),
        template: `
            <div class="flex gap-2">
                <Button v-for="name in ['web-01', 'web-02', 'db-primary']" :key="name" variant="outline" @click="popover?.open($event.currentTarget)">
                    {{ name }}
                </Button>
                <Popover ref="popover" placement="bottom-start">
                    <PopoverContent title="Server" description="Frankfurt · Ubuntu 26.04" />
                </Popover>
            </div>`,
    }),
};
