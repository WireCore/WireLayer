import type { Meta, StoryObj } from '@storybook/vue3-vite';
import type { ConcreteComponent } from 'vue';
import Avatar from '../Avatar/Avatar.vue';
import Badge from '../Badge/Badge.vue';
import OverflowListComponent from './OverflowList.vue';

// Generic component: Storybook's Vue types can't infer the args here
const OverflowList = OverflowListComponent as unknown as ConcreteComponent;

const tags = ['Vue', 'React', 'Nuxt', 'Next.js', 'Tailwind', 'TypeScript', 'Docker', 'Kubernetes', 'PostgreSQL'];
const people = ['Anna Berg', 'Ben Ott', 'Clara Weiß', 'David Kühn', 'Eva Lang', 'Finn Roth', 'Gina Sommer'];

const meta = {
    title: 'Data/OverflowList',
    component: OverflowList,
    render: () => ({
        components: { Badge, OverflowList },
        setup: () => ({ tags }),
        template: `
            <div class="w-[min(420px,90vw)] resize-x overflow-auto rounded-lg border border-line p-3">
                <OverflowList :items="tags" label="Technologies">
                    <template #item="{ item }"><Badge>{{ item }}</Badge></template>
                </OverflowList>
            </div>`,
    }),
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** What does not fit goes behind "+N"; the popover lists the rest. Drag the corner to resize */
export const Playground: Story = {};

/** At most three, the rest behind "+N" even with room */
export const MaxVisible: Story = {
    render: () => ({
        components: { Badge, OverflowList },
        setup: () => ({ tags }),
        template: `
            <OverflowList :items="tags" :max-visible="3" label="Technologies">
                <template #item="{ item }"><Badge>{{ item }}</Badge></template>
            </OverflowList>`,
    }),
};

/** Avatars (like an AvatarGroup that shortens itself), hidden from the start */
export const People: Story = {
    name: 'People',
    render: () => ({
        components: { Avatar, OverflowList },
        setup: () => ({ people }),
        template: `
            <div class="w-56 rounded-lg border border-line p-3">
                <OverflowList :items="people" collapse-from="start" label="Project team">
                    <template #item="{ item }"><Avatar :name="item" color="auto" size="sm" /></template>
                </OverflowList>
            </div>`,
    }),
};

/** Up to two rows before shortening */
export const TwoRows: Story = {
    name: 'Two rows',
    render: () => ({
        components: { Badge, OverflowList },
        setup: () => ({ tags }),
        template: `
            <div class="w-64 rounded-lg border border-line p-3">
                <OverflowList :items="tags" :max-rows="2" label="Technologies">
                    <template #item="{ item }"><Badge>{{ item }}</Badge></template>
                </OverflowList>
            </div>`,
    }),
};
