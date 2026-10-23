import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { EmojiPicker, type EmojiPickerProps } from './EmojiPicker.js';

function Demo(args: EmojiPickerProps) {
    const [chosen, setChosen] = useState('');
    return (
        <div className="flex flex-col gap-3">
            <EmojiPicker {...args} onSelect={(entry) => setChosen(entry.emoji)} />
            <span className="text-sm text-muted">Selected: {chosen || '–'}</span>
        </div>
    );
}

const meta = {
    title: 'Forms/EmojiPicker',
    component: EmojiPicker,
    args: { columns: 8, search: true, recent: true },
    render: (args) => <Demo {...args} />,
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
