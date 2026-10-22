import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Avatar from '../Avatar/Avatar.vue';
import HoverCard from './HoverCard.vue';

const meta = {
    title: 'Overlays/HoverCard',
    component: HoverCard,
    args: { openDelay: 500, closeDelay: 300 },
    render: (args) => ({
        components: { Avatar, HoverCard },
        setup: () => ({ args }),
        template: `
            <p class="text-sm">
                Owner:
                <HoverCard v-bind="args">
                    <a href="#julia" class="font-semibold underline underline-offset-2">Julia Klein</a>
                    <template #content>
                        <div class="flex items-center gap-3">
                            <Avatar name="Julia Klein" />
                            <div class="flex flex-col">
                                <span class="font-semibold">Julia Klein</span>
                                <span class="text-xs text-muted">Engineering · Frankfurt</span>
                            </div>
                        </div>
                    </template>
                </HoverCard>
            </p>`,
    }),
} satisfies Meta<typeof HoverCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Opened from code at an element (`card.open(element)`, template ref) – here at the name that was clicked */
export const OpenAtAnchor: Story = {
    render: () => ({
        components: { HoverCard },
        setup: () => ({ card: ref<InstanceType<typeof HoverCard> | null>(null), name: ref('') }),
        template: `
            <div class="flex gap-4 text-sm">
                <button
                    v-for="person in ['Julia Klein', 'Jonas Weber']"
                    :key="person"
                    type="button"
                    class="underline underline-offset-2"
                    @click="name = person; card?.toggle($event.currentTarget)"
                >
                    {{ person }}
                </button>
                <HoverCard ref="card">
                    <template #content><span class="text-sm">{{ name }} · Engineering</span></template>
                </HoverCard>
            </div>`,
    }),
};
