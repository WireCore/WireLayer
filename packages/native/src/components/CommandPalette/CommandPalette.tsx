import {
    commandGroups,
    commandPalette,
    filterCommands,
    type DataSource,
    type ListItemAccessors,
} from '@wirecore/wirelayer-recipes/native';
import { Search } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Platform, Pressable, Text, View } from 'react-native';
import { useTranslations } from '../../locale.js';
import { useAnnouncer } from '../../utils/announce.js';
import { useOptionSource } from '../../utils/data-source.js';
import { Icon, type IconComponent } from '../../utils/Icon.js';
import { Loader } from '../../utils/Loader.js';
import { Sheet } from '../../utils/Sheet.js';
import { useControllable } from '../../utils/useControllable.js';
import { Highlight } from '../Highlight/Highlight.js';
import { Input } from '../Input/Input.js';
import { Kbd } from '../Kbd/Kbd.js';

export interface CommandItem {
    value: string;
    label: string;
    /** Heading of the group, e.g. "Pages" or "Actions" */
    group?: string;
    icon?: IconComponent;
    /** Further words that find the item */
    keywords?: string[];
    /** Shortcut hint on the right (display only) */
    shortcut?: string;
    /** Second line below the label */
    description?: string;
}

export interface CommandPaletteProps {
    items: CommandItem[];
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    /** An item was chosen */
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
    /** Web only: Strg+K / ⌘K anywhere on the page opens and closes it (default true); `false` switches it off */
    hotkey?: boolean;
    placeholder?: string;
    /** At most this many results */
    limit?: number;
    /**
     * Own matching: a score per item (higher first, `false`/0 hides it) – or `false` to show the items as they are
     * (results from the server, see `onFilterChange`)
     */
    filter?: ((item: CommandItem, query: string) => number | boolean) | false;
    /** Marks the searched text in the labels (default true) */
    highlight?: boolean;
    /** Empties the search field when it closes (default true) */
    clearQueryOnClose?: boolean;
    /** Closes after running an item (default true) */
    closeOnSelect?: boolean;
    /** Results are being loaded (e.g. after `onFilterChange`) */
    loading?: boolean;
    /** Text when nothing matches */
    emptyText?: string;
}

const NO_ITEMS: CommandItem[] = [];
const ACCESSORS: ListItemAccessors<CommandItem> = {};

type Row = { type: 'group'; key: string; label: string } | { type: 'item'; key: string; item: CommandItem };

/**
 * Search over pages and actions: a bottom sheet with a search field at the top and the matching items as buttons
 * in groups. The number of results is announced; the keyboard's search key runs the first one. Strg+K / ⌘K opens it
 * on the web.
 */
export function CommandPalette({
    items,
    open,
    onOpenChange,
    onSelect,
    onFilterChange,
    onSearch,
    dataSource,
    minSearchLength,
    hotkey = true,
    placeholder,
    limit,
    filter,
    highlight = true,
    clearQueryOnClose = true,
    closeOnSelect = true,
    loading,
    emptyText,
}: CommandPaletteProps) {
    const translations = useTranslations();
    const t = translations.commandPalette;
    const styles = commandPalette();
    const [isOpen, setOpen] = useControllable(open, false, onOpenChange);
    const [query, setQuery] = useState('');
    const { announce, region } = useAnnouncer();
    const source = useOptionSource<CommandItem>({
        items: NO_ITEMS,
        source: dataSource,
        accessors: ACCESSORS,
        minSearchLength,
    });
    const busy = !!loading || source.loading;

    // Closing starts the next search empty
    const [wasOpen, setWasOpen] = useState(isOpen);
    if (wasOpen !== isOpen) {
        setWasOpen(isOpen);
        if (!isOpen && clearQueryOnClose) setQuery('');
    }

    // The matching items, then the server's results (the server has filtered them)
    const results = useMemo(() => {
        const matches = filterCommands(items, query, { filter, limit });
        if (!source.active) return matches;
        const known = new Set(matches.map((item) => item.value));
        return [...matches, ...source.items.filter((item) => !known.has(item.value))];
    }, [items, query, filter, limit, source.active, source.items]);
    const rows: Row[] = commandGroups(results).flatMap((group) => [
        ...(group.group ? [{ type: 'group' as const, key: `group:${group.group}`, label: group.group }] : []),
        ...group.items.map((item) => ({ type: 'item' as const, key: `item:${item.value}`, item })),
    ]);

    // The number of results once typing pauses
    const count = results.length;
    useEffect(() => {
        if (!isOpen || !query.trim() || busy) return;
        const timer = setTimeout(() => announce(translations.jsonViewer.matches(count)), 600);
        return () => clearTimeout(timer);
    }, [isOpen, query, busy, count, announce, translations]);

    // Web: Strg+K / ⌘K toggles it – the latest state through a ref
    const toggle = useRef(() => setOpen(!isOpen));
    useEffect(() => {
        toggle.current = () => setOpen(!isOpen);
    });
    useEffect(() => {
        if (Platform.OS !== 'web' || !hotkey || typeof document === 'undefined') return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (!(event.ctrlKey || event.metaKey) || event.altKey || event.key.toLowerCase() !== 'k') return;
            event.preventDefault();
            toggle.current();
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [hotkey]);

    const changeQuery = (text: string) => {
        setQuery(text);
        onFilterChange?.(text);
        onSearch?.(text);
        if (source.active) source.search(text);
    };
    const choose = (item: CommandItem) => {
        onSelect?.(item.value);
        if (closeOnSelect) setOpen(false);
    };
    const footer = busy ? (
        <View className={styles.status()} role="status" aria-live="polite">
            <Loader className={styles.spinner()} />
            <Text className={styles.statusText()}>{translations.common.loading}</Text>
        </View>
    ) : !results.length ? (
        <Text role="status" className={styles.empty()}>
            {source.emptyText ?? emptyText ?? t.empty}
        </Text>
    ) : null;

    return (
        <Sheet
            open={isOpen}
            onClose={() => setOpen(false)}
            title={t.label}
            closeLabel={translations.common.close}
            scroll={false}
            className={styles.sheet()}
            onShow={() => {
                if (source.active) source.search(query);
            }}
            before={
                <Input
                    autoFocus
                    role="searchbox"
                    value={query}
                    onChangeText={changeQuery}
                    leadingIcon={Search}
                    clearable
                    loading={busy}
                    aria-label={t.label}
                    placeholder={placeholder ?? t.placeholder}
                    autoCorrect={false}
                    autoCapitalize="none"
                    returnKeyType="go"
                    onSubmitEditing={() => {
                        if (results[0]) choose(results[0]);
                    }}
                    className={styles.search()}
                />
            }
        >
            <FlatList
                data={rows}
                keyExtractor={(row) => row.key}
                aria-busy={busy || undefined}
                contentContainerClassName={styles.list()}
                keyboardShouldPersistTaps="handled"
                ListFooterComponent={footer ?? undefined}
                renderItem={({ item: row }) => {
                    if (row.type === 'group')
                        return (
                            <Text role="heading" className={styles.groupLabel()}>
                                {row.label}
                            </Text>
                        );
                    const { item } = row;
                    return (
                        <Pressable role="button" className={styles.item()} onPress={() => choose(item)}>
                            {!!item.icon && <Icon icon={item.icon} className={styles.icon()} />}
                            <View className={styles.body()}>
                                <Text className={styles.label()}>
                                    {highlight && query.trim() ? (
                                        <Highlight text={item.label} query={query.trim()} ignoreAccents />
                                    ) : (
                                        item.label
                                    )}
                                </Text>
                                {!!item.description && <Text className={styles.description()}>{item.description}</Text>}
                            </View>
                            {!!item.shortcut && (
                                <View aria-hidden>
                                    <Kbd>{item.shortcut}</Kbd>
                                </View>
                            )}
                        </Pressable>
                    );
                }}
            />
            {region}
        </Sheet>
    );
}
