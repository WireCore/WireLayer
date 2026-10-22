import { Cloud, CodeXml, Cpu, Network, Server, Sparkles } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Chip from './Chip.vue';
import ChipGroup from './ChipGroup.vue';

const meta = {
    title: 'Forms/ChipGroup',
    component: ChipGroup,
    args: { label: 'Services', defaultValue: ['web', 'hosting'], multiple: true, disabled: false },
    render: (args) => ({
        components: { Chip, ChipGroup },
        setup: () => ({ args, Cloud, CodeXml, Cpu, Network, Server, Sparkles }),
        template: `
            <ChipGroup v-bind="args" class="max-w-[420px]">
                <Chip value="web" :icon="CodeXml">Software &amp; Web</Chip>
                <Chip value="ai" :icon="Sparkles">AI &amp; LLM</Chip>
                <Chip value="hosting" :icon="Server">Hosting</Chip>
                <Chip value="cloud" :icon="Cloud">Cloud &amp; DevOps</Chip>
                <Chip value="hardware" :icon="Cpu">Hardware</Chip>
                <Chip value="network" :icon="Network">Network</Chip>
            </ChipGroup>`,
    }),
} satisfies Meta<typeof ChipGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
