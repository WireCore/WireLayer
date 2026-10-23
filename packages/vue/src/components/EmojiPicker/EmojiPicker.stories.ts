import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import EmojiPicker from './EmojiPicker.vue';

const meta = {
    title: 'Forms/EmojiPicker',
    component: EmojiPicker,
    args: { columns: 8, search: true, recent: true },
    render: (args) => ({
        components: { EmojiPicker },
        setup: () => ({ args, chosen: ref('') }),
        template: `
            <div class="flex flex-col gap-3">
                <EmojiPicker v-bind="args" @select="chosen = $event.emoji" />
                <span class="text-sm text-muted">Selected: {{ chosen || '–' }}</span>
            </div>`,
    }),
} satisfies Meta<typeof EmojiPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Search (English names, with a language module like German also its names), categories, a grid with arrow keys; recent ones first */
export const Playground: Story = {};

/** Own emojis (e.g. reactions) */
export const Reactions: Story = {
    name: 'Reactions',
    args: {
        columns: 6,
        search: false,
        recent: false,
        emojis: [
            { emoji: '👍', name: 'Thumbs up', category: 'people' },
            { emoji: '👏', name: 'Applause', category: 'people' },
            { emoji: '🎉', name: 'Celebrate', category: 'activities' },
            { emoji: '❤️', name: 'Heart', category: 'symbols' },
            { emoji: '👀', name: 'Looking into it', category: 'people' },
            { emoji: '✅', name: 'Done', category: 'symbols' },
        ],
    },
};
