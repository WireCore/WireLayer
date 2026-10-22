import { useFilter } from '@ark-ui/react/locale';
import { Menu as ArkMenu } from '@ark-ui/react/menu';
import { Portal } from '@ark-ui/react/portal';
import {
    filterMenuEntries,
    highlightFirstMenuItem,
    menu as menuRecipe,
    menuSearchKey,
    type OverlayHandle,
    type RecipeClasses,
    SUBMENU_GUTTER,
} from '@wirecore/wirelayer-recipes';
import { Check, ChevronRight, Circle } from 'lucide-react';
import {
    createContext,
    Fragment,
    useContext,
    useEffect,
    useRef,
    useState,
    type ElementType,
    type ReactElement,
    type ReactNode,
    type Ref,
} from 'react';
import type { IconComponent } from '../../types.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';
import { useAnchoredOverlay, type AnchorProp } from '../../overlay.js';

export interface MenuItem {
    value: string;
    label: string;
    /** Icon component before the label */
    icon?: IconComponent;
    /** Shortcut hint shown on the right, e.g. "⌘E" (display only) */
    shortcut?: string;
    /** Destructive action – shown in the danger colour */
    danger?: boolean;
    disabled?: boolean;
    /** Opens a submenu to the side (arrow right); the item itself is then not selectable */
    children?: MenuEntry[];
    /** Link target – the item is a link (rendered with the menu's `linkAs`, e.g. a router link) */
    href?: string;
    /** Closes the menu when chosen (default true) */
    closeOnSelect?: boolean;
}

/** Item that is switched on and off (role="menuitemcheckbox") */
export interface MenuCheckboxItem {
    type: 'checkbox';
    value: string;
    label: string;
    /** Initial state; changes are reported with checked-change / onCheckedChange */
    checked?: boolean;
    icon?: IconComponent;
    disabled?: boolean;
    /** Closes the menu when switched (default false: several can be switched in a row) */
    closeOnSelect?: boolean;
}

/** One choice of a radio group */
export interface MenuRadioItem {
    value: string;
    label: string;
    icon?: IconComponent;
    disabled?: boolean;
    /** Closes the menu when chosen (default false) */
    closeOnSelect?: boolean;
}

/** Items of which exactly one is chosen (role="menuitemradio"), e.g. a sort order */
export interface MenuRadioGroup {
    type: 'radio';
    /** Name of the group – reported with value-change / onValueChange */
    name: string;
    /** Heading of the group */
    label?: string;
    /** Initially chosen value */
    value?: string;
    items: MenuRadioItem[];
}

/** Items under a heading */
export interface MenuGroup {
    type: 'group';
    label: string;
    items: MenuEntry[];
}

export interface MenuSeparator {
    type: 'separator';
}

export type MenuEntry = MenuItem | MenuGroup | MenuSeparator | MenuCheckboxItem | MenuRadioGroup;

/** Own content of an item (instead of icon, label and shortcut) */
export type MenuItemRenderer = (item: MenuItem | MenuCheckboxItem | MenuRadioItem) => ReactNode;

/** State of the checkbox and radio items of a menu, how links and items are rendered – shared with MenuEntries */
interface MenuState {
    checked: (entry: MenuCheckboxItem) => boolean;
    setChecked: (entry: MenuCheckboxItem, checked: boolean) => void;
    radio: (group: MenuRadioGroup) => string | undefined;
    setRadio: (group: MenuRadioGroup, value: string) => void;
    linkAs: ElementType;
    renderItem?: MenuItemRenderer;
}

const MenuStateContext = createContext<MenuState | null>(null);

/**
 * Checkbox and radio items start with the state of the items and keep their changes until new items arrive, so the
 * menu works without handling the events (they still report every change).
 */
function useMenuStateValue(options: {
    items: unknown;
    linkAs?: ElementType;
    renderItem?: MenuItemRenderer;
    onCheckedChange?: (value: string, checked: boolean) => void;
    onValueChange?: (name: string, value: string) => void;
}): MenuState {
    const [changed, setChanged] = useState({
        items: options.items,
        checked: {} as Record<string, boolean>,
        radio: {} as Record<string, string>,
    });
    const current = changed.items === options.items ? changed : { items: options.items, checked: {}, radio: {} };
    if (current !== changed) setChanged(current);
    return {
        checked: (entry) => current.checked[entry.value] ?? entry.checked ?? false,
        setChecked: (entry, checked) => {
            setChanged({ ...current, checked: { ...current.checked, [entry.value]: checked } });
            options.onCheckedChange?.(entry.value, checked);
        },
        radio: (group) => current.radio[group.name] ?? group.value,
        setRadio: (group, value) => {
            setChanged({ ...current, radio: { ...current.radio, [group.name]: value } });
            options.onValueChange?.(group.name, value);
        },
        linkAs: options.linkAs ?? 'a',
        renderItem: options.renderItem,
    };
}

/** Provides the item state of a menu (Menu, ContextMenu, Menubar) */
export function MenuStateProvider({
    children,
    ...options
}: Parameters<typeof useMenuStateValue>[0] & { children: ReactNode }) {
    return <MenuStateContext.Provider value={useMenuStateValue(options)}>{children}</MenuStateContext.Provider>;
}

/** Events and options shared by Menu, ContextMenu and Menubar */
export interface MenuItemOptions {
    onSelect?: (value: string) => void;
    /** A checkbox item was switched */
    onCheckedChange?: (value: string, checked: boolean) => void;
    /** A radio group got a new value */
    onValueChange?: (name: string, value: string) => void;
    /** Component for items with href, e.g. a router link (gets `href`); default <a> */
    linkAs?: ElementType;
    /** Own content of an item (instead of icon, label and shortcut) */
    renderItem?: MenuItemRenderer;
}

export interface MenuProps extends MenuItemOptions {
    /**
     * Items, groups ({ type: 'group' }), separators ({ type: 'separator' }), checkbox items ({ type: 'checkbox' }) and
     * radio groups ({ type: 'radio' }); items with children open a submenu, items with href are links
     */
    items: MenuEntry[];
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    /** Element, ref or point to open at instead of the trigger; open with `open` or `ref.current.open(anchor)` */
    anchor?: AnchorProp;
    /** Filter field at the top – for long menus; arrow keys move through the matching items, Enter chooses */
    searchable?: boolean;
    /** Placeholder and accessible name of the filter field */
    searchLabel?: string;
    /** open(anchor), close(), toggle(anchor) – to open the menu at any element or pointer position */
    ref?: Ref<OverlayHandle>;
    /** The trigger element, e.g. a Button or IconButton – optional with `anchor` or `open(anchor)` */
    children?: ReactElement;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof menuRecipe>;
}

export function Menu({
    classes,
    items,
    onSelect,
    onCheckedChange,
    onValueChange,
    linkAs,
    renderItem,
    open,
    defaultOpen,
    onOpenChange,
    anchor,
    searchable,
    searchLabel,
    ref,
    children,
}: MenuProps) {
    const menu = useRecipe('menu', menuRecipe, classes);
    const styles = menu();
    const translations = useTranslations();
    const state = useAnchoredOverlay({ open, defaultOpen, anchor, onOpenChange, ref, restoreFocus: true });

    // Filter field: accent- and case-blind over the labels; the filter starts empty with every opening
    const [query, setQuery] = useState('');
    const [activeId, setActiveId] = useState<string>();
    const filters = useFilter({ sensitivity: 'base', usage: 'sort' });
    const entries = searchable && query ? filterMenuEntries(items, (label) => filters.contains(label, query)) : items;
    const search = useRef<HTMLInputElement>(null);
    // Every opening starts with an empty filter
    const [wasOpen, setWasOpen] = useState(state.isOpen);
    if (wasOpen !== state.isOpen) {
        setWasOpen(state.isOpen);
        setQuery('');
        setActiveId(undefined);
    }
    useEffect(() => {
        if (!state.isOpen || !searchable) return;
        // After Ark has focused the menu
        let frame = requestAnimationFrame(() => {
            frame = requestAnimationFrame(() => search.current?.focus());
        });
        return () => cancelAnimationFrame(frame);
    }, [state.isOpen, searchable]);
    const label = searchLabel ?? translations.menu.search;

    return (
        <MenuStateProvider
            items={items}
            linkAs={linkAs}
            renderItem={renderItem}
            onCheckedChange={onCheckedChange}
            onValueChange={onValueChange}
        >
            <ArkMenu.Root
                open={state.isOpen}
                onOpenChange={(details) => state.onOpenChange(details.open)}
                positioning={state.positioning({})}
                anchorPoint={state.anchorPoint}
                lazyMount
                unmountOnExit
                onSelect={(details) => onSelect?.(details.value)}
            >
                {children && <ArkMenu.Trigger asChild>{children}</ArkMenu.Trigger>}
                <Portal>
                    <ArkMenu.Positioner>
                        <ArkMenu.Content className={styles.content()}>
                            {searchable && (
                                <ArkMenu.Context>
                                    {(api) => {
                                        return (
                                            // A group: a text field may not sit directly in a menu
                                            <div role="group" aria-label={label} className={styles.search()}>
                                                {/* Uncontrolled: it is created empty with every opening */}
                                                <input
                                                    ref={search}
                                                    type="text"
                                                    autoComplete="off"
                                                    className={styles.searchInput()}
                                                    placeholder={label}
                                                    aria-label={label}
                                                    aria-activedescendant={activeId}
                                                    onChange={(event) => {
                                                        const field = event.currentTarget;
                                                        setQuery(field.value);
                                                        // After the filter applied, the first match is highlighted
                                                        requestAnimationFrame(() =>
                                                            setActiveId(highlightFirstMenuItem(field, api))
                                                        );
                                                    }}
                                                    onKeyDown={(event) => {
                                                        const id = menuSearchKey(event.nativeEvent, api);
                                                        if (id) setActiveId(id);
                                                    }}
                                                />
                                            </div>
                                        );
                                    }}
                                </ArkMenu.Context>
                            )}
                            <MenuEntries entries={entries} onSelect={onSelect} />
                            {searchable && !entries.length && (
                                <div role="group" className={styles.empty()}>
                                    <span role="status">{translations.common.noResults}</span>
                                </div>
                            )}
                        </ArkMenu.Content>
                    </ArkMenu.Positioner>
                </Portal>
            </ArkMenu.Root>
        </MenuStateProvider>
    );
}

/** Content of an item: own renderer or icon, label (and shortcut) */
function ItemContent({ item, shortcut }: { item: MenuItem | MenuCheckboxItem | MenuRadioItem; shortcut?: string }) {
    const state = useContext(MenuStateContext);
    const menu = useRecipe('menu', menuRecipe);
    const styles = menu();
    if (state?.renderItem) return state.renderItem(item);
    const Icon = item.icon;
    return (
        <>
            {Icon && <Icon className={styles.icon()} aria-hidden="true" />}
            <span className={styles.label()}>{item.label}</span>
            {shortcut && (
                <span className={styles.shortcut()} aria-hidden="true">
                    {shortcut}
                </span>
            )}
        </>
    );
}

/**
 * Items, groups with a heading, checkbox and radio items, separators and submenus (recursive) – shared by Menu,
 * ContextMenu, Menubar
 */
export function MenuEntries({ entries, onSelect }: { entries: MenuEntry[]; onSelect?: (value: string) => void }) {
    const menu = useRecipe('menu', menuRecipe);
    const styles = menu();
    const state = useContext(MenuStateContext);
    return entries.map((entry, index) => {
        if ('type' in entry) {
            if (entry.type === 'separator')
                return <ArkMenu.Separator key={`separator-${index}`} className={styles.separator()} />;
            if (entry.type === 'checkbox')
                return (
                    <ArkMenu.CheckboxItem
                        key={entry.value}
                        value={entry.value}
                        checked={state?.checked(entry) ?? !!entry.checked}
                        onCheckedChange={(checked) => state?.setChecked(entry, checked)}
                        disabled={entry.disabled}
                        closeOnSelect={entry.closeOnSelect ?? false}
                        className={styles.item()}
                    >
                        <span className={styles.indicator()}>
                            <ArkMenu.ItemIndicator>
                                <Check className={styles.indicatorIcon()} aria-hidden="true" />
                            </ArkMenu.ItemIndicator>
                        </span>
                        <ItemContent item={entry} />
                    </ArkMenu.CheckboxItem>
                );
            if (entry.type === 'radio')
                return (
                    <ArkMenu.RadioItemGroup
                        key={`radio-${entry.name}`}
                        value={state?.radio(entry)}
                        onValueChange={(details) => state?.setRadio(entry, details.value)}
                    >
                        {entry.label && (
                            <ArkMenu.ItemGroupLabel className={styles.groupLabel()}>
                                {entry.label}
                            </ArkMenu.ItemGroupLabel>
                        )}
                        {entry.items.map((option) => (
                            <ArkMenu.RadioItem
                                key={option.value}
                                value={option.value}
                                disabled={option.disabled}
                                closeOnSelect={option.closeOnSelect ?? false}
                                className={styles.item()}
                            >
                                <span className={styles.indicator()}>
                                    <ArkMenu.ItemIndicator>
                                        <Circle className={styles.indicatorDot()} aria-hidden="true" />
                                    </ArkMenu.ItemIndicator>
                                </span>
                                <ItemContent item={option} />
                            </ArkMenu.RadioItem>
                        ))}
                    </ArkMenu.RadioItemGroup>
                );
            return (
                <ArkMenu.ItemGroup key={`group-${index}`}>
                    <ArkMenu.ItemGroupLabel className={styles.groupLabel()}>{entry.label}</ArkMenu.ItemGroupLabel>
                    <MenuEntries entries={entry.items} onSelect={onSelect} />
                </ArkMenu.ItemGroup>
            );
        }
        const Icon = entry.icon;
        if (entry.children)
            return (
                <ArkMenu.Root
                    key={entry.value}
                    positioning={{ placement: 'right-start', offset: { mainAxis: SUBMENU_GUTTER } }}
                    onSelect={(details) => onSelect?.(details.value)}
                >
                    <ArkMenu.TriggerItem className={styles.item()}>
                        {Icon && <Icon className={styles.icon()} aria-hidden="true" />}
                        <span className={styles.label()}>{entry.label}</span>
                        <ChevronRight className={styles.submenuIcon()} aria-hidden="true" />
                    </ArkMenu.TriggerItem>
                    <Portal>
                        <ArkMenu.Positioner>
                            <ArkMenu.Content className={styles.content()}>
                                <MenuEntries entries={entry.children} onSelect={onSelect} />
                            </ArkMenu.Content>
                        </ArkMenu.Positioner>
                    </Portal>
                </ArkMenu.Root>
            );
        if (entry.href) {
            const Link = state?.linkAs ?? 'a';
            return (
                <ArkMenu.Item
                    key={entry.value}
                    value={entry.value}
                    disabled={entry.disabled}
                    closeOnSelect={entry.closeOnSelect}
                    asChild
                >
                    <Link href={entry.href} className={menu({ danger: entry.danger }).item()}>
                        <ItemContent item={entry} shortcut={entry.shortcut} />
                    </Link>
                </ArkMenu.Item>
            );
        }
        return (
            <Fragment key={entry.value}>
                <ArkMenu.Item
                    value={entry.value}
                    disabled={entry.disabled}
                    closeOnSelect={entry.closeOnSelect}
                    className={menu({ danger: entry.danger }).item()}
                >
                    <ItemContent item={entry} shortcut={entry.shortcut} />
                </ArkMenu.Item>
            </Fragment>
        );
    });
}
