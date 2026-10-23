import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import type { EmojiData } from '@wirecore/wirelayer-recipes/native';
import { Smile } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { Button } from '../Button/Button.js';
import { Text } from '../Text/Text.js';
import { EmojiPicker, type EmojiPickerProps } from './EmojiPicker.js';

function InlineDemo(args: EmojiPickerProps) {
    const [chosen, setChosen] = useState<EmojiData | null>(null);
    const [recent, setRecent] = useState<string[]>(['👍', '🎉']);
    return (
        <View className="gap-3">
            <EmojiPicker {...args} recentEmojis={recent} onRecentChange={setRecent} onSelect={setChosen} />
            <Text aria-live="polite">{chosen ? `Selected: ${chosen.emoji} ${chosen.name}` : ' '}</Text>
        </View>
    );
}

const meta = {
    title: 'Forms/EmojiPicker',
    component: EmojiPicker,
    args: { columns: 8, search: true, recent: true },
    decorators: [(Story) => <View className="w-[360px]">{Story()}</View>],
    render: (args) => <InlineDemo {...args} />,
} satisfies Meta<typeof EmojiPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Inline: search (English words, with a language module like German also its words), categories as tabs, recent emojis first */
export const Playground: Story = {};

function SheetDemo() {
    const [open, setOpen] = useState(false);
    const [text, setText] = useState('Have a nice weekend');
    return (
        <View className="items-start gap-3">
            <Text>{text}</Text>
            <Button variant="outline" leadingIcon={Smile} onPress={() => setOpen(true)}>
                Insert emoji
            </Button>
            <EmojiPicker
                open={open}
                onOpenChange={setOpen}
                onSelect={(emoji) => {
                    setText((current) => `${current} ${emoji.emoji}`);
                    setOpen(false);
                }}
            />
        </View>
    );
}

/** In a bottom sheet (open/onOpenChange) – the app closes it after choosing */
export const InSheet: Story = { name: 'In a sheet', render: () => <SheetDemo /> };

/** Own emojis, six per row, without search */
export const OwnEmojis: Story = {
    name: 'Custom selection',
    args: {
        columns: 6,
        search: false,
        recent: false,
        emojis: [
            { emoji: '👍', name: 'Thumbs up', category: 'people' },
            { emoji: '👀', name: 'Eyes', category: 'people' },
            { emoji: '🎉', name: 'Confetti', category: 'activities' },
            { emoji: '✅', name: 'Done', category: 'symbols' },
            { emoji: '❤️', name: 'Heart', category: 'symbols' },
            { emoji: '🚀', name: 'Rocket', category: 'travel' },
        ],
    },
};
