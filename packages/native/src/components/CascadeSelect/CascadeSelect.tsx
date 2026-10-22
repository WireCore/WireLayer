import {
    cascadeSelect,
    ChildrenLoader,
    input,
    isLazyNode,
    listValueKey,
    pluralText,
    searchCascade,
    withLoadedChildren,
    type ChildrenLoaderState,
    type ChildrenStatus,
    type DataSource,
    type ItemAccessor,
} from '@wirecore/wirelayer-recipes/native';
import { Check, ChevronLeft, ChevronRight, RotateCw, Search } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import { I18nManager, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useResolveClassNames } from 'uniwind';
import { useLocale } from '../../locale.js';
import { useAnnouncer } from '../../utils/announce.js';
import { focusElement } from '../../utils/focus-registry.js';
import { Icon, type IconComponent } from '../../utils/Icon.js';
import { Loader } from '../../utils/Loader.js';
import { PickerTrigger } from '../../utils/PickerTrigger.js';
import { Sheet } from '../../utils/Sheet.js';
import { useControllable } from '../../utils/useControllable.js';
import { Highlight } from '../Highlight/Highlight.js';
import { useFieldControl } from '../Field/Field.js';

export interface CascadeOption<V = string> {
    /** Any type (string, number, object – see `valueKey`) */
    value: V;
    label: string;
    /** Icon component shown before the label */
    icon?: IconComponent;
    disabled?: boolean;
    /** Options of the next level; only options without children can be chosen (unless `changeOnSelect`) */
    children?: CascadeOption<V>[];
    /** Has options that are loaded when the level opens (`loadChildren`, `dataSource` or `onLoadChildren`) */
    hasChildren?: boolean;
    /** false: like `hasChildren: true` */
    leaf?: boolean;
}

export interface CascadeSelectProps<V = string> {
    items: CascadeOption<V>[];
    /** Chosen value; any type (see `valueKey`) */
    value?: V | null;
    defaultValue?: V | null;
    onValueChange?: (value: V | null) => void;
    placeholder?: string;
    /** Title of the sheet – default: the Field label or the placeholder */
    title?: string;
    /** Separator of the path shown in the field and in the sheet ("Germany › Bavaria › Munich") */
    separator?: string;
    disabled?: boolean;
    invalid?: boolean;
    /** Identifies object values (property name or function), e.g. "id" – without it objects are compared by content */
    valueKey?: ItemAccessor<V, string | number>;
    /** The levels in between can be chosen, too (first entry of each level: "Choose <level>") */
    changeOnSelect?: boolean;
    /** Search field in the sheet: the hits are listed with their whole path */
    filter?: boolean;
    /** Button next to the field that clears the value */
    clearable?: boolean;
    /** Accessible name of the clear button (default "Clear selection") */
    clearLabel?: string;
    /** Shows a spinner in the field (busy) */
    loading?: boolean;
    /** Height of the field: 32, 40 (default) or 48 pt */
    size?: 'sm' | 'md' | 'lg';
    /** Loads the options of a level (`hasChildren: true`) when it opens; the signal aborts it */
    loadChildren?: (option: CascadeOption<V>, request: { signal: AbortSignal }) => Promise<CascadeOption<V>[]>;
    /** A lazy level opened and there is no loadChildren/dataSource: add its options to the items */
    onLoadChildren?: (option: CascadeOption<V>) => void;
    /** Source of the options of lazy levels (`getChildren`) */
    dataSource?: DataSource<CascadeOption<V>>;
    /** Accessible name without a surrounding Field */
    'aria-label'?: string;
    /** Accessible name of the sheet's close button */
    closeLabel?: string;
    className?: string;
}

const empty = { status: {}, children: {}, errors: {} };
const BACK = '\u0000back';

/**
 * Select with cascading levels: the trigger shows the whole path and opens a sheet with one level at a time – a
 * radio group per level, an option with children opens the next level, "Back" goes up; the path is the
 * subtitle. With `filter` a search lists the hits with their path.
 */
export function CascadeSelect<V = string>({
    items: itemsProp,
    value,
    defaultValue = null,
    onValueChange,
    placeholder,
    title,
    separator = ' › ',
    disabled,
    invalid,
    valueKey,
    changeOnSelect = false,
    filter = false,
    clearable = false,
    clearLabel,
    loading = false,
    size,
    loadChildren,
    onLoadChildren,
    dataSource,
    'aria-label': ariaLabel,
    closeLabel,
    className,
}: CascadeSelectProps<V>) {
    type Option = CascadeOption<V>;
    const { translations, locale } = useLocale();
    const t = translations.cascadeSelect;
    const control = useFieldControl({ invalid, disabled });
    const { announce, region } = useAnnouncer();
    const styles = cascadeSelect();
    const field = input({ hasIcon: true, class: styles.search() });
    const muted = useResolveClassNames('text-muted');
    const web = Platform.OS === 'web';
    const keyOf = (option: Option) => listValueKey(option.value, valueKey);

    // Options of lazy levels: from loadChildren/dataSource, or the parent (onLoadChildren)
    const [loaded, setLoaded] = useState<ChildrenLoaderState<Option>>(empty);
    const [asked, setAsked] = useState<Set<string>>(() => new Set());
    const items = useMemo(
        () => withLoadedChildren(itemsProp, loaded.children, (option) => listValueKey(option.value, valueKey)),
        [itemsProp, loaded.children, valueKey]
    );
    const pathTo = (key: string | null, list: Option[] = items, path: Option[] = []): Option[] | undefined => {
        if (key === null) return undefined;
        for (const option of list) {
            if (keyOf(option) === key) return [...path, option];
            const found = option.children && pathTo(key, option.children, [...path, option]);
            if (found) return found;
        }
        return undefined;
    };
    // The loader's callbacks run later: they read the props, items and texts of the last render
    const latest = useRef({ loadChildren, dataSource, valueKey, items, translations, locale, announce });
    useEffect(() => {
        latest.current = { loadChildren, dataSource, valueKey, items, translations, locale, announce };
    });
    const loadedRef = useRef<ChildrenLoaderState<Option>>(empty);
    const loader = useRef<ChildrenLoader<Option> | undefined>(undefined);
    const getLoader = () =>
        (loader.current ??= new ChildrenLoader<Option>({
            key: (option) => listValueKey(option.value, latest.current.valueKey),
            load: (option, request) =>
                latest.current.loadChildren
                    ? latest.current.loadChildren(option, request)
                    : latest.current.dataSource!.getChildren!(option, request).then((result) => result.items),
            onChange: (state) => {
                const before = loadedRef.current.status;
                loadedRef.current = state;
                const { translations: texts, locale: lang, items: options } = latest.current;
                const find = (key: string, list: Option[]): Option | undefined => {
                    for (const option of list) {
                        if (listValueKey(option.value, latest.current.valueKey) === key) return option;
                        const found = option.children && find(key, option.children);
                        if (found) return found;
                    }
                    return undefined;
                };
                for (const [key, next] of Object.entries(state.status)) {
                    if (before[key] === next) continue;
                    const label = find(key, options)?.label ?? key;
                    latest.current.announce(
                        next === 'loading'
                            ? texts.tree.loadingNode(label)
                            : next === 'error'
                              ? texts.tree.loadError(label)
                              : pluralText(texts.tree.loadedNode, state.children[key]?.length ?? 0, lang).replace(
                                    '{label}',
                                    label
                                )
                    );
                }
                setLoaded(state);
            },
        }));
    useEffect(
        () => () => {
            loader.current?.dispose();
            loader.current = undefined;
        },
        []
    );
    const ownLoader = !!loadChildren || !!dataSource?.getChildren;
    const statusOf = (option: Option): ChildrenStatus | undefined =>
        isLazyNode(option)
            ? (loaded.status[keyOf(option)] ?? (asked.has(keyOf(option)) ? 'loading' : undefined))
            : undefined;
    const requestLevel = (option: Option) => {
        if (!isLazyNode(option)) return;
        if (ownLoader) void getLoader().load(option);
        else if (!asked.has(keyOf(option))) {
            setAsked((before) => new Set([...before, keyOf(option)]));
            announce(translations.tree.loadingNode(option.label));
            onLoadChildren?.(option);
        }
    };
    const retry = (option: Option) => {
        if (ownLoader) void getLoader().load(option, { force: true });
        else onLoadChildren?.(option);
    };

    // The value and the path it was chosen with (kept for values whose option is not loaded)
    const [current, setCurrent] = useControllable<V | null>(value, defaultValue, onValueChange);
    const currentKey = current === null || current === undefined ? null : listValueKey(current, valueKey);
    const [remembered, setRemembered] = useState<Option[] | undefined>(undefined);
    const path =
        pathTo(currentKey) ?? (remembered && keyOf(remembered.at(-1)!) === currentKey ? remembered : undefined);
    const pathText = path?.map((option) => option.label).join(separator);
    const placeholderText = placeholder ?? translations.common.placeholder;
    const label = control.label ?? ariaLabel;
    const sheetTitle = title ?? label ?? placeholderText;

    // The sheet: the opened levels (keys from the top), the search, where the focus goes after a change of level
    const [open, setOpen] = useState(false);
    const [levelKeys, setLevelKeys] = useState<string[]>([]);
    const [query, setQuery] = useState('');
    const [focusKey, setFocusKey] = useState<string | null>(null);
    const levels: Option[] = [];
    for (const key of levelKeys) {
        const option = (levels.at(-1)?.children ?? items).find((entry) => keyOf(entry) === key);
        if (!option) break;
        levels.push(option);
    }
    const parent = levels.at(-1);
    const options = parent ? (parent.children ?? []) : items;
    const levelStatus = parent ? statusOf(parent) : undefined;
    const levelPath = levels.map((option) => option.label).join(separator);
    const searching = filter && !!query.trim();

    const back = useRef<ComponentRef<typeof Pressable>>(null);
    const rows = useRef(new Map<string, ComponentRef<typeof Pressable>>());
    useEffect(() => {
        if (!open || focusKey === null) return;
        focusElement(focusKey === BACK ? back.current : (rows.current.get(focusKey) ?? null));
    }, [open, focusKey, levelKeys]);
    const registerRow = (key: string) => (node: ComponentRef<typeof Pressable> | null) => {
        if (node) rows.current.set(key, node);
        else rows.current.delete(key);
    };

    const openSheet = () => {
        // The level of the chosen option is open
        setLevelKeys(path ? path.slice(0, -1).map(keyOf) : []);
        setFocusKey(path ? keyOf(path.at(-1)!) : null);
        setOpen(true);
    };
    const close = () => {
        setOpen(false);
        setQuery('');
        setFocusKey(null);
    };
    const openLevel = (option: Option) => {
        setLevelKeys([...levels.map(keyOf), keyOf(option)]);
        setFocusKey(BACK);
        announce([...levels, option].map((entry) => entry.label).join(', '));
        requestLevel(option);
    };
    const goBack = () => {
        setLevelKeys(levels.slice(0, -1).map(keyOf));
        setFocusKey(parent ? keyOf(parent) : null);
    };
    const choose = (chosenPath: Option[]) => {
        setRemembered(chosenPath);
        setCurrent(chosenPath.at(-1)!.value);
        close();
    };

    const radio = (option: Option, chosenPath: Option[], text: string, highlight?: string) => {
        const key = keyOf(option);
        const checked = key === currentKey;
        const itemStyles = cascadeSelect({ selected: checked, disabled: option.disabled });
        return (
            <Pressable
                key={key}
                ref={registerRow(key)}
                role="radio"
                aria-checked={checked}
                disabled={option.disabled}
                aria-disabled={option.disabled || undefined}
                // A hit of the search on iOS/Android: the path read with pauses instead of the separator
                {...(!web && highlight !== undefined
                    ? { 'aria-label': chosenPath.map((entry) => entry.label).join(', ') }
                    : {})}
                className={itemStyles.item()}
                onPress={() => choose(chosenPath)}
            >
                {option.icon && <Icon icon={option.icon} className={itemStyles.icon()} />}
                <Text className={itemStyles.text()}>
                    {highlight !== undefined ? (
                        <Highlight text={text} query={highlight.trim().split(/\s+/)} ignoreAccents />
                    ) : (
                        text
                    )}
                </Text>
                {checked && <Icon icon={Check} className={itemStyles.check()} />}
            </Pressable>
        );
    };

    const matches = searching ? searchCascade(items, query, (option) => option.label, { changeOnSelect }) : [];
    const ClosedChevron = I18nManager.isRTL ? ChevronLeft : ChevronRight;
    const BackChevron = I18nManager.isRTL ? ChevronRight : ChevronLeft;

    const levelContent = (
        <>
            <View role="radiogroup" aria-label={parent?.label ?? sheetTitle}>
                {parent && changeOnSelect && radio(parent, levels, t.choose(parent.label))}
                {options.map((option) => {
                    if (!option.children && !isLazyNode(option))
                        return radio(option, [...levels, option], option.label);
                    const key = keyOf(option);
                    // Holds the chosen value: marked like a chosen option, but it opens the next level
                    const holds = !!path?.some((entry) => keyOf(entry) === key);
                    const itemStyles = cascadeSelect({ selected: holds, disabled: option.disabled });
                    return (
                        <Pressable
                            key={key}
                            ref={registerRow(key)}
                            role="button"
                            disabled={option.disabled}
                            aria-disabled={option.disabled || undefined}
                            className={itemStyles.item()}
                            onPress={() => openLevel(option)}
                        >
                            {option.icon && <Icon icon={option.icon} className={itemStyles.icon()} />}
                            <Text className={itemStyles.text()}>{option.label}</Text>
                            <Icon icon={ClosedChevron} className={itemStyles.chevron()} />
                        </Pressable>
                    );
                })}
            </View>
            {levelStatus === 'loading' && (
                <View className={styles.status()}>
                    <Loader className={styles.spinner()} />
                    <Text className={styles.statusText()}>{translations.common.loading}</Text>
                </View>
            )}
            {levelStatus === 'error' && parent && (
                // The options of the level failed to load: pressing this row loads them again
                <Pressable role="button" className={styles.item()} onPress={() => retry(parent)}>
                    <Icon icon={RotateCw} className={styles.retryIcon()} />
                    <Text className={styles.retryText()}>{translations.tree.retry}</Text>
                </Pressable>
            )}
            {!options.length && !levelStatus && (
                <Text className={styles.statusText({ class: styles.status() })}>{translations.common.empty}</Text>
            )}
        </>
    );

    const searchContent = matches.length ? (
        <View role="radiogroup" aria-label={sheetTitle}>
            {matches.map((match) => radio(match.node, match.path, match.labels.join(separator), query))}
        </View>
    ) : (
        <Text role="status" className={styles.statusText({ class: styles.status() })}>
            {translations.common.noResults}
        </Text>
    );

    return (
        <>
            <PickerTrigger
                label={label}
                text={pathText}
                placeholder={placeholderText}
                open={open}
                invalid={control.invalid}
                disabled={control.disabled}
                controlProps={control.props}
                controlId={control.controlId}
                onPress={openSheet}
                size={size}
                loading={loading && !open}
                onClear={clearable ? () => setCurrent(null) : undefined}
                clearLabel={clearLabel ?? translations.select.clear}
                className={className}
            />
            <Sheet
                open={open}
                onClose={close}
                title={sheetTitle}
                closeLabel={closeLabel ?? translations.common.close}
                description={!searching && levelPath ? levelPath : undefined}
                onShow={() => {
                    if (focusKey) focusElement(rows.current.get(focusKey) ?? null);
                }}
                before={
                    <>
                        {filter && (
                            <View className={field.base()}>
                                <Icon icon={Search} className={field.icon()} />
                                <TextInput
                                    value={query}
                                    onChangeText={setQuery}
                                    aria-label={t.search}
                                    placeholder={translations.combobox.search}
                                    placeholderTextColor={typeof muted.color === 'string' ? muted.color : undefined}
                                    autoCorrect={false}
                                    autoCapitalize="none"
                                    className={field.control()}
                                />
                            </View>
                        )}
                        {!searching && parent && (
                            <Pressable ref={back} role="button" className={styles.back()} onPress={goBack}>
                                <Icon icon={BackChevron} className={styles.backIcon()} />
                                <Text className={styles.backLabel()}>{translations.pageHeader.back}</Text>
                            </Pressable>
                        )}
                    </>
                }
            >
                {searching ? searchContent : levelContent}
                {/* Inside the dialog: announcements come from the open sheet (levels loading) */}
                {region}
            </Sheet>
        </>
    );
}
