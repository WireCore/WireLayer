import {
    addRecentEmoji,
    emojiCategories,
    emojiPicker,
    localeEmojis,
    searchEmojis,
    type EmojiCategory,
    type EmojiData,
} from '@wirecore/wirelayer-recipes/native';
import { Search } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, Text, View, type ViewProps } from 'react-native';
import { useLocale } from '../../locale.js';
import { useAnnouncer } from '../../utils/announce.js';
import { Sheet } from '../../utils/Sheet.js';
import { useControllable } from '../../utils/useControllable.js';
import { Input } from '../Input/Input.js';

export interface EmojiPickerProps extends Omit<ViewProps, 'children'> {
    /** The emojis to offer (default: about 500 common ones with names and search words in the language) */
    emojis?: EmojiData[];
    /** Emojis per row (default 8) */
    columns?: number;
    /** Search field (default true) */
    search?: boolean;
    /** Remembers the last chosen emojis and offers them first (default true) */
    recent?: boolean;
    /** Recently used emojis, newest first (controlled – e.g. kept by the app in its storage) */
    recentEmojis?: string[];
    /** The recently used emojis changed – store them to keep them across starts */
    onRecentChange?: (emojis: string[]) => void;
    /** Most recently used emojis kept (default 24) */
    maxRecent?: number;
    /** Accessible name of the picker and title of the sheet (default "Emojis") */
    label?: string;
    /** An emoji was chosen */
    onSelect?: (emoji: EmojiData) => void;
    /** Shows the picker in a bottom sheet (controlled) – without `open` and `onOpenChange` it is shown inline */
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    className?: string;
}

const icons: Record<EmojiCategory, string> = {
    recent: '🕘',
    smileys: '😀',
    people: '👋',
    nature: '🐶',
    food: '🍎',
    travel: '✈️',
    activities: '⚽',
    objects: '💡',
    symbols: '❤️',
};
const NO_RECENT: string[] = [];

/**
 * Emoji picker: search (in the language and English), categories as tabs, a grid of buttons named by the emoji
 * (at least 44 pt); recently used emojis come first. Inline – or in a bottom sheet with `open`/`onOpenChange`.
 */
export function EmojiPicker({
    emojis,
    columns = 8,
    search = true,
    recent = true,
    recentEmojis,
    onRecentChange,
    maxRecent = 24,
    label,
    onSelect,
    open,
    onOpenChange,
    className,
    ...props
}: EmojiPickerProps) {
    const { locale, translations } = useLocale();
    const t = translations.emojiPicker;
    const inSheet = open !== undefined || onOpenChange !== undefined;
    const styles = emojiPicker({ inSheet });
    const { announce, region } = useAnnouncer();
    const all = useMemo(() => emojis ?? localeEmojis(locale, t.emojis), [emojis, locale, t]);
    const [stored, setStored] = useControllable(recentEmojis, NO_RECENT, onRecentChange);
    const recentEntries = useMemo(
        () =>
            recent ? stored.map((emoji) => all.find((entry) => entry.emoji === emoji)).filter((entry) => !!entry) : [],
        [recent, stored, all]
    );
    const categories = emojiCategories.filter((category) =>
        category === 'recent' ? recentEntries.length > 0 : all.some((entry) => entry.category === category)
    );
    const [chosen, setChosen] = useState<EmojiCategory | null>(null);
    const category = chosen && categories.includes(chosen) ? chosen : (categories[0] ?? 'smileys');
    const [query, setQuery] = useState('');
    const searching = !!query.trim();
    const shown = searching
        ? searchEmojis(all, query)
        : category === 'recent'
          ? recentEntries
          : all.filter((entry) => entry.category === category);
    const heading = searching ? t.results : t.categories[category]!;

    // The number of hits once typing pauses
    const count = shown.length;
    useEffect(() => {
        if (!searching) return;
        const timer = setTimeout(() => announce(t.count(count)), 600);
        return () => clearTimeout(timer);
    }, [searching, query, count, announce, t]);

    const pick = (entry: EmojiData) => {
        if (recent) setStored(addRecentEmoji(stored, entry.emoji, maxRecent));
        onSelect?.(entry);
    };

    const content = (
        <>
            {search && (
                <Input
                    role="searchbox"
                    value={query}
                    onChangeText={setQuery}
                    leadingIcon={Search}
                    clearable
                    aria-label={t.search}
                    placeholder={t.search}
                    autoCorrect={false}
                    autoCapitalize="none"
                />
            )}
            {!searching && (
                <View role="tablist" aria-label={t.categoryNav} className={styles.categories()}>
                    {categories.map((entry) => (
                        <Pressable
                            key={entry}
                            role="tab"
                            aria-selected={entry === category}
                            aria-label={t.categories[entry]}
                            className={emojiPicker({ selected: entry === category }).category()}
                            onPress={() => setChosen(entry)}
                        >
                            <Text aria-hidden className={styles.categoryIcon()}>
                                {icons[entry]}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            )}
            <Text className={styles.heading()}>{heading}</Text>
            {shown.length ? (
                <FlatList
                    // A new list (search, category, columns) starts at its top
                    key={`${searching ? 'search' : category}-${columns}`}
                    data={shown}
                    numColumns={columns}
                    keyExtractor={(entry) => entry.emoji}
                    role="group"
                    aria-label={heading}
                    className={styles.grid()}
                    keyboardShouldPersistTaps="handled"
                    initialNumToRender={columns * 8}
                    renderItem={({ item: entry }) => (
                        <Pressable
                            role="button"
                            aria-label={entry.name}
                            className={styles.cell()}
                            style={{ width: `${100 / columns}%` }}
                            onPress={() => pick(entry)}
                        >
                            <Text aria-hidden className={styles.emoji()}>
                                {entry.emoji}
                            </Text>
                        </Pressable>
                    )}
                />
            ) : (
                <Text className={styles.empty()}>{t.empty}</Text>
            )}
            {region}
        </>
    );

    if (inSheet)
        return (
            <Sheet
                open={!!open}
                onClose={() => onOpenChange?.(false)}
                title={label ?? t.label}
                closeLabel={translations.common.close}
                scroll={false}
                className={styles.sheet()}
            >
                <View {...props} className={styles.sheetContent({ class: className })}>
                    {content}
                </View>
            </Sheet>
        );
    return (
        <View {...props} role="group" aria-label={label ?? t.label} className={styles.base({ class: className })}>
            {content}
        </View>
    );
}
