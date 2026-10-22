import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { Heart } from '@lucide/vue';
import { ref } from 'vue';
import Rating from './Rating.vue';

const meta = {
    title: 'Forms/Rating',
    component: Rating,
    args: {
        label: 'How satisfied are you?',
        count: 5,
        allowHalf: false,
        readOnly: false,
        disabled: false,
        size: 'md',
    },
    argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
    render: (args) => ({
        components: { Rating },
        setup: () => ({ args, value: ref(4) }),
        template: `
            <div class="flex flex-col gap-3">
                <Rating v-bind="args" v-model="value" />
                <span class="text-xs text-muted">Value: {{ value }}</span>
            </div>`,
    }),
} satisfies Meta<typeof Rating>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const ReadOnly: Story = {
    render: () => ({
        components: { Rating },
        template: `<Rating aria-label="Average rating" :default-value="3.5" allow-half read-only size="sm" />`,
    }),
};

/** Clicking the chosen star again (or Delete) clears the rating; own symbol instead of the star */
export const ClearAndOwnIcon: Story = {
    render: () => ({
        components: { Rating },
        setup: () => ({ value: ref(3), Heart }),
        template: `
            <div class="flex flex-col gap-3">
                <Rating v-model="value" label="How do you like it?" allow-clear :icon="Heart" />
                <span class="text-xs text-muted">Value: {{ value }}</span>
            </div>`,
    }),
};
