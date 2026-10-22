import {
    addRecentEmoji,
    emojiCategories,
    emojiPicker as emojiPickerRecipe,
    gridIndexForKey,
    localeEmojis,
    searchEmojis,
    type EmojiCategory,
    type EmojiData,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { Search } from 'lucide-react';
import {
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    type ComponentProps,
    type CSSProperties,
    type KeyboardEvent,
} from 'react';
import { useLocalStorage } from '../../hooks/storage.js';
import { Input } from '../Input/Input.js';
import { useLocale } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface EmojiPickerProps extends Omit<ComponentProps<'div'>, 'onSelect' | 'children'> {
    /** The emojis to offer (default: about 500 common ones with names and search words in the language) */
    emojis?: EmojiData[];
    /** Emojis per row (default 8) */
    columns?: number;
    /** Search field (default true) */
    search?: boolean;
    /** Remembers the last chosen emojis (localStorage, default true) */
    recent?: boolean;
    /** localStorage key of the recently used emojis */
    recentKey?: string;
    /** Most recently used emojis kept (default 24) */
    maxRecent?: number;
    /** Accessible name of the picker (default "Emojis") */
    label?: string;
    /** An emoji was chosen (click, Enter or Space) */
    onSelect?: (emoji: EmojiData) => void;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof emojiPickerRecipe>;
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
const noRecent: string[] = [];

/**
 * Emoji picker: search (German words), categories, a grid (arrow keys, Home/End, Ctrl+Home/End; Enter or Space
 * chooses); the name of the focused emoji is shown below. Recently used emojis come first.
 */
export function EmojiPicker({
    classes,
    emojis,
    columns = 8,
    search = true,
    recent = true,
    recentKey = 'wirecore-emoji-recent',
    maxRecent = 24,
    label,
    onSelect,
    className,
    ...props
}: EmojiPickerProps) {
    const emojiPicker = useRecipe('emojiPicker', emojiPickerRecipe, classes);
    const styles = emojiPicker();
    const { locale, translations } = useLocale();
    const t = translations.emojiPicker;
    const headingId = `${useId()}heading`;
    const grid = useRef<HTMLDivElement>(null);
    const focusRequest = useRef<number | null>(null);
    const all = useMemo(
        () => emojis ?? localeEmojis(locale, translations.emojiPicker.emojis),
        [emojis, locale, translations]
    );
    const [stored, setStored] = useLocalStorage<string[]>(recentKey, noRecent);
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
    const shown = query.trim()
        ? searchEmojis(all, query)
        : category === 'recent'
          ? recentEntries
          : all.filter((entry) => entry.category === category);
    const rows: { entry: EmojiData; index: number }[][] = [];
    shown.forEach((entry, index) => {
        if (index % columns === 0) rows.push([]);
        rows.at(-1)!.push({ entry, index });
    });
    // A new list (search or category) starts at its first emoji
    const listKey = query.trim() ? `search:${query.trim()}` : `category:${category}`;
    const [cursor, setCursor] = useState<{ list: string; index: number; preview: EmojiData | null }>({
        list: listKey,
        index: 0,
        preview: null,
    });
    const focused = cursor.list === listKey ? cursor.index : 0;
    const preview = cursor.list === listKey ? cursor.preview : null;
    useEffect(() => {
        const index = focusRequest.current;
        if (index === null) return;
        focusRequest.current = null;
        grid.current?.querySelectorAll<HTMLElement>('button')[index]?.focus();
    });

    const pick = (entry: EmojiData) => {
        if (recent) setStored(addRecentEmoji(stored, entry.emoji, maxRecent));
        onSelect?.(entry);
    };
    const focusCell = (index: number) => {
        setCursor({ list: listKey, index, preview: shown[index] ?? null });
        focusRequest.current = index;
    };
    const onGridKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
        const next = gridIndexForKey(event.key, focused, shown.length, columns, { ctrl: event.ctrlKey, rtl });
        if (next === undefined) return;
        event.preventDefault();
        focusCell(next);
    };

    return (
        <div {...props} className={styles.base({ class: className })} role="group" aria-label={label ?? t.label}>
            {search && (
                <Input
                    value={query}
                    onChange={(event) => setQuery(event.currentTarget.value)}
                    type="search"
                    size="sm"
                    leadingIcon={Search}
                    clearable
                    placeholder={t.search}
                    aria-label={t.search}
                    onKeyDown={(event) => {
                        if (event.key !== 'ArrowDown' || !shown.length) return;
                        event.preventDefault();
                        focusCell(0);
                    }}
                />
            )}
            {!query.trim() && (
                <div role="group" aria-label={t.categoryNav} className={styles.categories()}>
                    {categories.map((entry) => (
                        <button
                            key={entry}
                            type="button"
                            className={styles.category()}
                            aria-pressed={entry === category}
                            aria-label={t.categories[entry]}
                            title={t.categories[entry]}
                            onClick={() => setChosen(entry)}
                        >
                            {icons[entry]}
                        </button>
                    ))}
                </div>
            )}
            <div id={headingId} className={styles.heading()}>
                {query.trim() ? t.results : t.categories[category]}
            </div>
            {shown.length ? (
                <div
                    ref={grid}
                    role="grid"
                    aria-labelledby={headingId}
                    className={styles.grid()}
                    style={{ '--wc-columns': String(columns) } as CSSProperties}
                    onKeyDown={onGridKeyDown}
                >
                    {rows.map((row, rowIndex) => (
                        <div key={rowIndex} role="row" className={styles.row()}>
                            {row.map((cell) => (
                                <div key={cell.entry.emoji} role="gridcell" className={styles.cell()}>
                                    <button
                                        type="button"
                                        className={styles.emoji()}
                                        tabIndex={cell.index === focused ? 0 : -1}
                                        aria-label={cell.entry.name}
                                        onClick={() => pick(cell.entry)}
                                        onFocus={() =>
                                            setCursor({ list: listKey, index: cell.index, preview: cell.entry })
                                        }
                                        onMouseEnter={() =>
                                            setCursor({ list: listKey, index: focused, preview: cell.entry })
                                        }
                                    >
                                        {cell.entry.emoji}
                                    </button>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            ) : (
                <p className={styles.empty()}>{t.empty}</p>
            )}
            <div className={styles.footer()} aria-hidden="true">
                {preview && (
                    <>
                        <span className={styles.footerEmoji()}>{preview.emoji}</span>
                        <span>{preview.name}</span>
                    </>
                )}
            </div>
            <span role="status" className={styles.status()}>
                {query.trim() ? t.count(shown.length) : ''}
            </span>
        </div>
    );
}
