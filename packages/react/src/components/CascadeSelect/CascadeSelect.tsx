import { createListCollection } from '@ark-ui/react/collection';
import { Combobox as ArkCombobox } from '@ark-ui/react/combobox';
import { useFieldContext } from '@ark-ui/react/field';
import { Menu as ArkMenu } from '@ark-ui/react/menu';
import { Portal } from '@ark-ui/react/portal';
import {
    controlIds,
    cascadeSelect as cascadeSelectRecipe,
    ChildrenLoader,
    isLazyNode,
    listValueKey,
    pluralText,
    searchCascade,
    withLoadedChildren,
    type ChildrenLoaderState,
    type ChildrenStatus,
    type DataSource,
    type ItemAccessor,
    type RecipeClasses,
    SUBMENU_GUTTER,
} from '@wirecore/wirelayer-recipes';
import { Check, ChevronDown, ChevronRight, LoaderCircle, RotateCw, X } from 'lucide-react';
import {
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
    type KeyboardEvent,
    type PointerEvent,
    type ReactNode,
} from 'react';
import type { IconComponent } from '../../types.js';
import { Highlight } from '../Highlight/Highlight.js';
import { useLocale } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface CascadeOption<V = string> {
    /** Any type (string, number, object – see `valueKey`) */
    value: V;
    label: string;
    icon?: IconComponent;
    /** Only for options without children */
    disabled?: boolean;
    /** Sub-options open to the side; only options without children can be chosen (unless `changeOnSelect`) */
    children?: CascadeOption<V>[];
    /** Has sub-options that are loaded when the level opens (`loadChildren`, `dataSource` or `onLoadChildren`) */
    hasChildren?: boolean;
    /** false: like `hasChildren: true` */
    leaf?: boolean;
}

export interface CascadeSelectProps<V = string> {
    items: readonly CascadeOption<V>[];
    /** Chosen value; any type (see `valueKey`) */
    value?: V | null;
    defaultValue?: V | null;
    onValueChange?: (value: V | null) => void;
    placeholder?: string;
    /** Separator of the path shown in the trigger ("Germany › Bavaria › Munich") */
    separator?: string;
    disabled?: boolean;
    invalid?: boolean;
    /** Identifies object values (property name or function), e.g. "id" – without it objects are compared by content */
    valueKey?: ItemAccessor<V, string | number>;
    /** The levels in between can be chosen, too (first entry of each level: "Choose <level>") */
    changeOnSelect?: boolean;
    /** Levels open on hover and click (default), or on click (and arrow keys) only */
    expandTrigger?: 'click' | 'hover';
    /** The field becomes a search field: hits as a flat list with their path; a button opens the levels */
    filter?: boolean;
    /** Button that clears the value (also Delete on the closed field) */
    clearable?: boolean;
    /** Shows a spinner in the field (aria-busy) */
    loading?: boolean;
    /** Height of the field: 32, 40 (default) or 48 px */
    size?: 'sm' | 'md' | 'lg';
    /** Loads the options of a level (`hasChildren: true`) when it opens; the signal aborts it */
    loadChildren?: (option: CascadeOption<V>, request: { signal: AbortSignal }) => Promise<CascadeOption<V>[]>;
    /** A lazy level opened and there is no loadChildren/dataSource: add its options to the items */
    onLoadChildren?: (option: CascadeOption<V>) => void;
    /** Source of the options of lazy levels (`getChildren`) */
    dataSource?: DataSource<CascadeOption<V>>;
    'aria-label'?: string;
    /** Id of the field (the trigger, with `filter` the search field), e.g. for a `<label for>` */
    id?: string;
    className?: string;
    style?: CSSProperties;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof cascadeSelectRecipe>;
}

const empty = { status: {}, children: {}, errors: {} };

/**
 * Select with cascading levels: a menu whose groups open to the side (arrow right/left), the options are
 * radio items. The trigger shows the whole path. With `filter` the field is a combobox: the hits are listed
 * with their path, the button at its end opens the levels.
 */
export function CascadeSelect<V = string>({
    classes,
    items: itemsProp,
    value,
    defaultValue = null,
    onValueChange,
    placeholder,
    separator = ' › ',
    disabled,
    invalid,
    valueKey,
    changeOnSelect = false,
    expandTrigger = 'hover',
    filter = false,
    clearable = false,
    loading = false,
    size,
    loadChildren,
    onLoadChildren,
    dataSource,
    'aria-label': ariaLabel,
    id,
    className,
    style,
}: CascadeSelectProps<V>) {
    type Option = CascadeOption<V>;
    const cascadeSelect = useRecipe('cascadeSelect', cascadeSelectRecipe, classes);
    const styles = cascadeSelect({ size, clearable: clearable && !filter });
    const { translations, locale } = useLocale();
    const field = useFieldContext();
    const uid = useId();
    const keyOf = (option: Option) => listValueKey(option.value, valueKey);
    const [status, setStatus] = useState('');

    // Options of lazy levels: from loadChildren/dataSource, or the parent (onLoadChildren)
    const [loaded, setLoaded] = useState<ChildrenLoaderState<Option>>(empty);
    const loadedRef = useRef<ChildrenLoaderState<Option>>(empty);
    const [asked, setAsked] = useState<Set<string>>(() => new Set());
    const items = useMemo(
        () => withLoadedChildren(itemsProp, loaded.children, (option) => listValueKey(option.value, valueKey)),
        [itemsProp, loaded.children, valueKey]
    );
    // The loader's callbacks run later: they read the props and items of the last render
    const latest = useRef({ loadChildren, dataSource, valueKey, items });
    useEffect(() => {
        latest.current = { loadChildren, dataSource, valueKey, items };
    });
    const pathTo = (key: string | null, list: Option[] = items, path: Option[] = []): Option[] | undefined => {
        if (key === null) return undefined;
        for (const option of list) {
            if (keyOf(option) === key) return [...path, option];
            const found = option.children && pathTo(key, option.children, [...path, option]);
            if (found) return found;
        }
        return undefined;
    };
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
                for (const [key, next] of Object.entries(state.status)) {
                    if (before[key] === next) continue;
                    const label = pathTo(key, latest.current.items)?.at(-1)?.label ?? key;
                    setStatus(
                        next === 'loading'
                            ? translations.tree.loadingNode(label)
                            : next === 'error'
                              ? translations.tree.loadError(label)
                              : pluralText(
                                    translations.tree.loadedNode,
                                    state.children[key]?.length ?? 0,
                                    locale
                                ).replace('{label}', label)
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
    const openLevel = (option: Option) => {
        if (!isLazyNode(option)) return;
        if (ownLoader) void getLoader().load(option);
        else if (!asked.has(keyOf(option))) {
            setAsked((before) => new Set([...before, keyOf(option)]));
            setStatus(translations.tree.loadingNode(option.label));
            onLoadChildren?.(option);
        }
    };
    const retry = (option: Option) => {
        if (ownLoader) void getLoader().load(option, { force: true });
        else onLoadChildren?.(option);
    };

    const [internal, setInternal] = useState<V | null>(defaultValue);
    const current = value === undefined ? internal : value;
    const currentKey = current === null || current === undefined ? null : listValueKey(current, valueKey);
    // A chosen value whose option is not loaded (yet) keeps the path it was chosen with
    const [remembered, setRemembered] = useState<Option[] | undefined>(undefined);
    const path =
        pathTo(currentKey) ?? (remembered && keyOf(remembered.at(-1)!) === currentKey ? remembered : undefined);
    const pathText = path?.map((option) => option.label).join(separator);
    const placeholderText = placeholder ?? translations.common.placeholder;
    const text = pathText ?? placeholderText;
    const isDisabled = disabled ?? field?.disabled;
    const isInvalid = invalid ?? field?.invalid;
    const choose = (key: string) => {
        const found = pathTo(key);
        if (!found) return;
        setRemembered(found);
        const next = found.at(-1)!.value;
        setInternal(next);
        onValueChange?.(next);
    };
    const clear = () => {
        setInternal(null);
        onValueChange?.(null);
    };
    const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
        if (!clearable || !path || (event.key !== 'Backspace' && event.key !== 'Delete')) return;
        event.preventDefault();
        clear();
    };
    // Click mode: hovering does not open a level (the pointer move never reaches Ark's handler)
    const hover =
        expandTrigger === 'click' ? { onPointerMoveCapture: (event: PointerEvent) => event.stopPropagation() } : {};

    const level = (options: Option[], parent?: Option, levelStatus?: ChildrenStatus): ReactNode => (
        <ArkMenu.RadioItemGroup value={currentKey ?? ''} onValueChange={(details) => choose(details.value)}>
            {parent && changeOnSelect && (
                <ArkMenu.RadioItem value={keyOf(parent)} className={styles.item()}>
                    <ArkMenu.ItemText className={styles.text()}>
                        {translations.cascadeSelect.choose(parent.label)}
                    </ArkMenu.ItemText>
                    <ArkMenu.ItemIndicator>
                        <Check className={styles.check()} aria-hidden="true" />
                    </ArkMenu.ItemIndicator>
                </ArkMenu.RadioItem>
            )}
            {levelStatus === 'loading' ? (
                <ArkMenu.Item value="" disabled className={styles.item()}>
                    <LoaderCircle className={styles.loadingIcon()} aria-hidden="true" />
                    <span className={styles.text()}>{translations.common.loading}</span>
                </ArkMenu.Item>
            ) : levelStatus === 'error' && parent ? (
                // The options of the level failed to load: activating this entry loads them again
                <ArkMenu.Item
                    value={`${keyOf(parent)}\u0000retry`}
                    closeOnSelect={false}
                    className={styles.item({ class: styles.retry() })}
                    onSelect={() => retry(parent)}
                >
                    <RotateCw className={styles.icon({ class: styles.retry() })} aria-hidden="true" />
                    <span className={styles.text()}>{translations.tree.retry}</span>
                </ArkMenu.Item>
            ) : null}
            {options.map((option) =>
                option.children || isLazyNode(option) ? (
                    <ArkMenu.Root
                        key={keyOf(option)}
                        positioning={{ placement: 'right-start', offset: { mainAxis: SUBMENU_GUTTER } }}
                        onOpenChange={(details) => details.open && openLevel(option)}
                    >
                        <ArkMenu.TriggerItem className={styles.item()} {...hover}>
                            {option.icon && <option.icon className={styles.icon()} aria-hidden="true" />}
                            <span className={styles.text()}>{option.label}</span>
                            <ChevronRight className={styles.submenuIcon()} aria-hidden="true" />
                        </ArkMenu.TriggerItem>
                        <Portal>
                            <ArkMenu.Positioner>
                                <ArkMenu.Content className={styles.content()}>
                                    {level(option.children ?? [], option, statusOf(option))}
                                </ArkMenu.Content>
                            </ArkMenu.Positioner>
                        </Portal>
                    </ArkMenu.Root>
                ) : (
                    <ArkMenu.RadioItem
                        key={keyOf(option)}
                        value={keyOf(option)}
                        disabled={option.disabled}
                        className={styles.item()}
                    >
                        {option.icon && <option.icon className={styles.icon()} aria-hidden="true" />}
                        <ArkMenu.ItemText className={styles.text()}>{option.label}</ArkMenu.ItemText>
                        <ArkMenu.ItemIndicator>
                            <Check className={styles.check()} aria-hidden="true" />
                        </ArkMenu.ItemIndicator>
                    </ArkMenu.RadioItem>
                )
            )}
        </ArkMenu.RadioItemGroup>
    );

    // Search (filter): hits with their path; the text shows the chosen path while not typing
    const [editing, setEditing] = useState(false);
    const [query, setQuery] = useState('');
    const matches = useMemo(
        () => searchCascade(items, query, (option) => option.label, { changeOnSelect }),
        [items, query, changeOnSelect]
    );
    const collection = useMemo(
        () =>
            createListCollection({
                items: matches,
                itemToString: (match) => match.labels.join(separator),
                itemToValue: (match) => listValueKey(match.node.value, valueKey),
                isItemDisabled: () => false,
            }),
        [matches, separator, valueKey]
    );
    const announcer =
        loadChildren || dataSource || asked.size ? (
            <span role="status" className={styles.status()}>
                {status}
            </span>
        ) : null;

    if (filter)
        return (
            <ArkCombobox.Root
                className={styles.base({ class: className })}
                style={style}
                collection={collection}
                value={currentKey ? [currentKey] : []}
                inputValue={editing ? query : (pathText ?? '')}
                disabled={isDisabled}
                invalid={isInvalid}
                placeholder={placeholderText}
                positioning={{ sameWidth: true, gutter: 4 }}
                translations={translations.combobox}
                openOnClick={false}
                {...controlIds(id, 'input', { label: field?.ids.label, input: field?.ids.control })}
                lazyMount
                unmountOnExit
                onValueChange={(details) => {
                    setEditing(false);
                    setQuery('');
                    if (details.value[0]) choose(details.value[0]);
                    else clear();
                }}
                onInputValueChange={(details) => {
                    const typing = details.reason === 'input-change';
                    setEditing(typing);
                    setQuery(typing ? details.inputValue : '');
                }}
            >
                <ArkCombobox.Control className={styles.searchControl()} data-invalid={isInvalid || undefined}>
                    <ArkCombobox.Input
                        className={styles.searchInput()}
                        aria-label={field ? undefined : (ariaLabel ?? translations.cascadeSelect.search)}
                        aria-busy={loading || undefined}
                    />
                    {clearable && (
                        <ArkCombobox.ClearTrigger className={styles.levelsTrigger()}>
                            <X className={styles.clearIcon()} aria-hidden="true" />
                        </ArkCombobox.ClearTrigger>
                    )}
                    <ArkMenu.Root positioning={{ placement: 'bottom-end', gutter: 4 }} lazyMount unmountOnExit>
                        <ArkMenu.Trigger
                            className={styles.levelsTrigger()}
                            disabled={isDisabled}
                            aria-label={translations.cascadeSelect.showLevels}
                        >
                            {loading ? (
                                <LoaderCircle className={styles.loadingIcon()} aria-hidden="true" />
                            ) : (
                                <ChevronDown className={styles.indicatorIcon()} aria-hidden="true" />
                            )}
                        </ArkMenu.Trigger>
                        <Portal>
                            <ArkMenu.Positioner>
                                <ArkMenu.Content className={styles.content()}>{level(items)}</ArkMenu.Content>
                            </ArkMenu.Positioner>
                        </Portal>
                    </ArkMenu.Root>
                </ArkCombobox.Control>
                <Portal>
                    <ArkCombobox.Positioner>
                        <ArkCombobox.Content className={styles.results()}>
                            <ArkCombobox.Empty className={styles.empty()}>
                                {translations.common.noResults}
                            </ArkCombobox.Empty>
                            {matches.map((match) => (
                                <ArkCombobox.Item key={keyOf(match.node)} item={match} className={styles.item()}>
                                    {match.node.icon && (
                                        <match.node.icon className={styles.icon()} aria-hidden="true" />
                                    )}
                                    <ArkCombobox.ItemText className={styles.path()}>
                                        <Highlight
                                            text={match.labels.join(separator)}
                                            query={query.split(/\s+/)}
                                            ignoreAccents
                                        />
                                    </ArkCombobox.ItemText>
                                    <ArkCombobox.ItemIndicator>
                                        <Check className={styles.check()} aria-hidden="true" />
                                    </ArkCombobox.ItemIndicator>
                                </ArkCombobox.Item>
                            ))}
                        </ArkCombobox.Content>
                    </ArkCombobox.Positioner>
                </Portal>
                <span role="status" className={styles.status()}>
                    {status}
                </span>
            </ArkCombobox.Root>
        );

    const triggerProps = {
        className: styles.trigger(),
        disabled: isDisabled,
        'data-invalid': isInvalid || undefined,
        'data-disabled': isDisabled || undefined,
        'aria-invalid': isInvalid || undefined,
        'aria-busy': loading || undefined,
        'aria-label': field ? undefined : ariaLabel ? `${ariaLabel}: ${text}` : undefined,
        'aria-labelledby': field ? `${field.ids.label} ${uid}value` : undefined,
        // Named by a <label for>: the chosen value as the description
        'aria-describedby': field ? field.ariaDescribedby : id && !ariaLabel ? `${uid}value` : undefined,
    };
    const triggerContent = (
        <>
            <span id={`${uid}value`} className={styles.value()} data-placeholder-shown={!path || undefined}>
                {text}
            </span>
            <ArkMenu.Indicator className={styles.indicator()}>
                {loading ? (
                    <LoaderCircle className={styles.spinner()} aria-hidden="true" />
                ) : (
                    <ChevronDown className={styles.indicatorIcon()} aria-hidden="true" />
                )}
            </ArkMenu.Indicator>
        </>
    );
    return (
        <ArkMenu.Root
            positioning={{ placement: 'bottom-start', gutter: 4 }}
            {...controlIds(id, 'trigger')}
            lazyMount
            unmountOnExit
        >
            <div className={styles.base({ class: className })} style={style}>
                {/* No wrapper without a clear button (unchanged DOM) */}
                {clearable ? (
                    <div className={styles.control()}>
                        <ArkMenu.Trigger {...triggerProps} onKeyDown={onTriggerKeyDown}>
                            {triggerContent}
                        </ArkMenu.Trigger>
                        {/* Not a tab stop: Backspace/Delete on the field clears, too */}
                        {path && !isDisabled && (
                            <button
                                type="button"
                                tabIndex={-1}
                                className={styles.clear()}
                                aria-label={translations.select.clear}
                                onClick={clear}
                            >
                                <X className={styles.clearIcon()} aria-hidden="true" />
                            </button>
                        )}
                    </div>
                ) : (
                    <ArkMenu.Trigger {...triggerProps}>{triggerContent}</ArkMenu.Trigger>
                )}
            </div>
            <Portal>
                <ArkMenu.Positioner>
                    <ArkMenu.Content className={styles.content()}>{level(items)}</ArkMenu.Content>
                </ArkMenu.Positioner>
            </Portal>
            {announcer}
        </ArkMenu.Root>
    );
}
