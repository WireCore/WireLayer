import { Dialog } from '@ark-ui/react/dialog';
import { createListCollection, Listbox } from '@ark-ui/react/listbox';
import { useFilter } from '@ark-ui/react/locale';
import { Portal } from '@ark-ui/react/portal';
import {
    commandPalette as commandPaletteRecipe,
    dialog as dialogRecipe,
    highlightChunks,
    rankItems,
    type DataSource,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { LoaderCircle, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useHotkeys } from '../../hooks/hotkeys.js';
import type { IconComponent } from '../../types.js';
import { Kbd } from '../Kbd/Kbd.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';
import { useDataSource } from '../../utils/data-source.js';

export interface CommandItem {
    value: string;
    label: string;
    /** Heading of the group, e.g. "Pages" or "Actions" */
    group?: string;
    icon?: IconComponent;
    /** Further words that find the item */
    keywords?: readonly string[];
    /** Shortcut hint on the right (display only) */
    shortcut?: string;
    /** Second line below the label */
    description?: string;
}

export interface CommandPaletteProps {
    items: readonly CommandItem[];
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    onSelect?: (value: string) => void;
    /** The search text changed – for results from the server (`filter={false}`, `loading`) */
    onFilterChange?: (query: string) => void;
    /** @deprecated Same as `onFilterChange` (the name of the other lists) */
    onSearch?: (query: string) => void;
    /**
     * Results from a server: asked with the search text after a typing pause (outdated answers dropped); they come
     * after the matching `items`
     */
    dataSource?: DataSource<CommandItem>;
    /** Fewest characters the search needs before the data source is asked (default 0) */
    minSearchLength?: number;
    /**
     * Opens with Strg+K / ⌘K anywhere on the page – or with own shortcuts: "mod+p", ["mod+k", "/"] (mod is Strg or ⌘;
     * shortcuts without Strg/⌘/Alt do not fire while typing in a field). `false` switches it off
     */
    hotkey?: boolean | string | string[];
    placeholder?: string;
    /** At most this many results */
    limit?: number;
    /**
     * Own matching: a score per item (higher first, `false`/0 hides it) – or `false` to show the items as they are
     * (results from the server, see `onSearch`)
     */
    filter?: ((item: CommandItem, query: string) => number | boolean) | false;
    /** Marks the searched text in the labels */
    highlight?: boolean;
    /** Starts with an empty search field every time it opens */
    clearQueryOnClose?: boolean;
    /** Closes after running an item */
    closeOnSelect?: boolean;
    /** Results are being loaded (e.g. after `onSearch`) */
    loading?: boolean;
    /** Text when nothing matches */
    emptyText?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof commandPaletteRecipe>;
}

/**
 * Dialog with a search field (combobox) and the matching items (listbox): typing filters, arrow keys move,
 * Enter runs, Escape closes. Strg+K / ⌘K opens it anywhere.
 */
export function CommandPalette({
    classes,
    items,
    open,
    onOpenChange,
    onSelect,
    onFilterChange,
    onSearch,
    dataSource,
    minSearchLength,
    hotkey = true,
    placeholder: placeholderProp,
    limit,
    filter,
    highlight = true,
    clearQueryOnClose = true,
    closeOnSelect = true,
    loading,
    emptyText,
}: CommandPaletteProps) {
    const commandPalette = useRecipe('commandPalette', commandPaletteRecipe, classes);
    const dialog = useRecipe('dialog', dialogRecipe);
    const styles = commandPalette();
    const backdrop = dialog().backdrop();
    const translations = useTranslations();
    const t = translations.commandPalette;
    const placeholder = placeholderProp ?? t.placeholder;
    const [internal, setInternal] = useState(false);
    const isOpen = open ?? internal;
    const [query, setQuery] = useState('');
    // Server results: asked when it opens and while typing
    const source = useDataSource<CommandItem>({ source: dataSource, minSearchLength });
    const search = useRef(source.search);
    const typed = useRef(query);
    useEffect(() => {
        search.current = source.search;
        typed.current = query;
    });
    useEffect(() => {
        if (isOpen && dataSource) search.current(typed.current, false);
    }, [isOpen, dataSource]);
    const busy = !!loading || (source.active && source.state.status === 'loading');
    const setOpen = (next: boolean) => {
        setInternal(next);
        if (next && clearQueryOnClose) setQuery('');
        onOpenChange?.(next);
    };

    // Filters without case and accents over label and keywords; groups keep their order
    // Accent-blind ("nu" finds "Nürnberg"): German search collation would tell u and ü apart
    const filters = useFilter({ sensitivity: 'base', usage: 'sort' });
    const matches =
        !query || filter === false
            ? limit === undefined
                ? items
                : items.slice(0, limit)
            : filter
              ? rankItems(items, (item) => filter(item, query), limit)
              : rankItems(
                    items,
                    (item) => [item.label, ...(item.keywords ?? [])].some((text) => filters.contains(text, query)),
                    limit
                );
    // The label, with the matched parts marked
    const label = (text: string) =>
        highlight && query
            ? highlightChunks(text, query, { ignoreAccents: true }).map((chunk, index) =>
                  chunk.match ? (
                      <mark key={index} className={styles.mark()}>
                          {chunk.text}
                      </mark>
                  ) : (
                      chunk.text
                  )
              )
            : text;
    // The server's results after the matching items (the server has filtered them)
    const sourceItems = source.active ? source.state.items : matches;
    const results = useMemo(
        () =>
            sourceItems === matches
                ? matches
                : [...matches, ...sourceItems.filter((item) => !matches.some((match) => match.value === item.value))],
        [matches, sourceItems]
    );
    const byGroup = new Map<string, CommandItem[]>();
    for (const item of results) byGroup.set(item.group ?? '', [...(byGroup.get(item.group ?? '') ?? []), item]);
    const groups = [...byGroup];
    const collection = useMemo(() => createListCollection({ items: results }), [results]);

    // Registered centrally (listed in the HotkeysDialog); toggles the palette like before
    const hotkeys = hotkey === true ? ['mod+k'] : hotkey === false ? [] : [hotkey].flat();
    useHotkeys(
        hotkeys.map((key) => [key, () => setOpen(!isOpen)]),
        { description: translations.hotkeys.commandPalette }
    );

    return (
        <Dialog.Root open={isOpen} onOpenChange={(details) => setOpen(details.open)} lazyMount unmountOnExit>
            <Portal>
                <Dialog.Backdrop className={backdrop} />
                <Dialog.Positioner className={styles.positioner()}>
                    <Dialog.Content className={styles.content()} aria-label={t.label}>
                        <Listbox.Root
                            collection={collection}
                            className={styles.list()}
                            value={[]}
                            onValueChange={(details) => {
                                if (!details.value[0]) return;
                                onSelect?.(details.value[0]);
                                if (closeOnSelect) setOpen(false);
                            }}
                        >
                            <div className={styles.search()}>
                                <Search className={styles.searchIcon()} aria-hidden="true" />
                                <Listbox.Input
                                    value={query}
                                    onChange={(event) => {
                                        setQuery(event.target.value);
                                        onFilterChange?.(event.target.value);
                                        onSearch?.(event.target.value);
                                        if (dataSource) source.search(event.target.value);
                                    }}
                                    className={styles.input()}
                                    role="combobox"
                                    aria-expanded="true"
                                    aria-label={t.label}
                                    placeholder={placeholder}
                                    autoHighlight
                                />
                            </div>
                            {busy && (
                                <div className={styles.loading()} role="status">
                                    <LoaderCircle className={styles.loadingIcon()} aria-hidden="true" />
                                    {translations.common.loading}
                                </div>
                            )}
                            <Listbox.Content
                                className={styles.list()}
                                aria-label={t.label}
                                aria-busy={busy || undefined}
                            >
                                {groups.map(([group, entries]) => (
                                    <Listbox.ItemGroup key={group}>
                                        {group && (
                                            <Listbox.ItemGroupLabel className={styles.groupLabel()}>
                                                {group}
                                            </Listbox.ItemGroupLabel>
                                        )}
                                        {entries.map((item) => {
                                            const Icon = item.icon;
                                            return (
                                                <Listbox.Item
                                                    key={item.value}
                                                    item={item}
                                                    className={styles.item()}
                                                    data-description={item.description ? '' : undefined}
                                                >
                                                    {Icon && <Icon className={styles.icon()} aria-hidden="true" />}
                                                    {item.description ? (
                                                        <span className={styles.itemBody()}>
                                                            <Listbox.ItemText className={styles.label()}>
                                                                {label(item.label)}
                                                            </Listbox.ItemText>
                                                            <span className={styles.description()}>
                                                                {item.description}
                                                            </span>
                                                        </span>
                                                    ) : (
                                                        <Listbox.ItemText className={styles.label()}>
                                                            {label(item.label)}
                                                        </Listbox.ItemText>
                                                    )}
                                                    {item.shortcut && (
                                                        <span aria-hidden="true">
                                                            <Kbd>{item.shortcut}</Kbd>
                                                        </span>
                                                    )}
                                                </Listbox.Item>
                                            );
                                        })}
                                    </Listbox.ItemGroup>
                                ))}
                                {!results.length && !busy && (
                                    <p className={styles.empty()}>
                                        {source.state.tooShort
                                            ? translations.dataSource.minSearch(minSearchLength ?? 0)
                                            : source.state.status === 'error'
                                              ? translations.dataSource.error
                                              : (emptyText ?? t.empty)}
                                    </p>
                                )}
                            </Listbox.Content>
                        </Listbox.Root>
                        <div className={styles.footer()} aria-hidden="true">
                            <span className={styles.hint()}>
                                <Kbd>↑</Kbd>
                                <Kbd>↓</Kbd> {t.navigate}
                            </span>
                            <span className={styles.hint()}>
                                <Kbd>Enter</Kbd> {t.run}
                            </span>
                            <span className={styles.hint()}>
                                <Kbd>Esc</Kbd> {t.close}
                            </span>
                        </div>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    );
}
