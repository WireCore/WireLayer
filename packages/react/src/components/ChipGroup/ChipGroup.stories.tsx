import type { Meta, StoryObj } from '@storybook/react-vite';
import { Cloud, CodeXml, Cpu, Network, Server, Sparkles } from 'lucide-react';
import { Chip } from './Chip.js';
import { ChipGroup } from './ChipGroup.js';

const meta = {
    title: 'Forms/ChipGroup',
    component: ChipGroup,
    args: { label: 'Services', defaultValue: ['web', 'hosting'], multiple: true, disabled: false },
    render: (args) => (
        <ChipGroup {...args} className="max-w-[420px]">
            <Chip value="web" icon={CodeXml}>
                Software &amp; Web
            </Chip>
            <Chip value="ai" icon={Sparkles}>
                AI &amp; LLM
            </Chip>
            <Chip value="hosting" icon={Server}>
                Hosting
            </Chip>
            <Chip value="cloud" icon={Cloud}>
                Cloud &amp; DevOps
            </Chip>
            <Chip value="hardware" icon={Cpu}>
                Hardware
            </Chip>
            <Chip value="network" icon={Network}>
                Network
            </Chip>
        </ChipGroup>
    ),
} satisfies Meta<typeof ChipGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
