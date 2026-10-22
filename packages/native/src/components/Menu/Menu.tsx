import { menu } from '@wirecore/wirelayer-recipes/native';
import { Check, ChevronLeft, ChevronRight, Circle } from 'lucide-react-native';
import {
    cloneElement,
    Fragment,
    useEffect,
    useRef,
    useState,
    type ComponentRef,
    type ReactElement,
    type ReactNode,
} from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { useTranslations } from '../../locale.js';
import { focusElement } from '../../utils/focus-registry.js';
import { Icon, type IconComponent } from '../../utils/Icon.js';
import { Sheet } from '../../utils/Sheet.js';
import { useControllable } from '../../utils/useControllable.js';

export interface MenuItem {
    value: string;
    label: string;
    /** Icon component before the label */
    icon?: IconComponent;
    /** Destructive action – shown in the danger colour */
    danger?: boolean;
    disabled?: boolean;
    /** Entries of a submenu – shown in the same sheet with a back row; the item itself is not selectable */
    children?: MenuEntry[];
    /** Closes the menu after the selection (default true) */
    closeOnSelect?: boolean;
}

/** An item that is switched on and off (role checkbox) */
export interface MenuCheckboxItem {
    type: 'checkbox';
    value: string;
    label: string;
    /** Checked at the start – later changes are reported through onCheckedChange */
    checked?: boolean;
    icon?: IconComponent;
    disabled?: boolean;
    /** Closes the menu after the change (default false) */
    closeOnSelect?: boolean;
}

export interface MenuRadioItem {
    value: string;
    label: string;
    icon?: IconComponent;
    disabled?: boolean;
    /** Closes the menu after the choice (default false) */
    closeOnSelect?: boolean;
}

/** Items of which exactly one is chosen (role radiogroup), e.g. the sort order */
export interface MenuRadioGroup {
    type: 'radio';
    /** Reported in onValueChange */
    name: string;
    /** Heading of the group */
    label?: string;
    /** Chosen at the start */
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

export type MenuEntry = MenuItem | MenuCheckboxItem | MenuRadioGroup | MenuGroup | MenuSeparator;

export interface MenuItemOptions {
    onSelect?: (value: string) => void;
    /** A checkbox item was switched */
    onCheckedChange?: (value: string, checked: boolean) => void;
    /** A radio item was chosen: the `name` of its group and its value */
    onValueChange?: (name: string, value: string) => void;
}

export interface MenuProps extends MenuItemOptions {
    items: MenuEntry[];
    /** Title of the sheet */
    title?: string;
    /** Accessible name of the sheet's close button */
    closeLabel?: string;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    /** The trigger, e.g. a Button or IconButton (gets onPress) – optional when `open` is controlled */
    children?: ReactElement<{ onPress?: () => void }>;
}

type Values = Record<string, boolean | string | undefined>;

/** Key of the first row of a level (items, checkbox items, the first radio item, inside groups) */
function firstRowKey(entries: MenuEntry[]): string | undefined {
    for (const entry of entries) {
        if (!('type' in entry)) return `i:${entry.value}`;
        if (entry.type === 'checkbox') return `c:${entry.value}`;
        if (entry.type === 'radio' && entry.items[0]) return `r:${entry.name}:${entry.items[0].value}`;
        if (entry.type === 'group') {
            const key = firstRowKey(entry.items);
            if (key) return key;
        }
    }
    return undefined;
}
const checkKey = (value: string) => `c:${value}`;
const radioKey = (name: string) => `r:${name}`;

/**
 * Action menu: the trigger opens a sheet with the actions (the mobile pattern for menus) – with checkbox and radio
 * items, groups, separators and submenus (shown in the same sheet with a back row).
 */
export function Menu({
    items,
    onSelect,
    onCheckedChange,
    onValueChange,
    title,
    closeLabel,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    children,
}: MenuProps) {
    const translations = useTranslations();
    const [open, setOpenState] = useControllable(openProp, defaultOpen, onOpenChange);
    // Open submenus, from the top level down (empty: the top level)
    const [path, setPath] = useState<MenuItem[]>([]);
    // Changed checkbox/radio states – kept until new items arrive
    const [changed, setChanged] = useState<{ source: MenuEntry[]; values: Values }>({ source: items, values: {} });
    const values = changed.source === items ? changed.values : {};
    const first = useRef<ComponentRef<typeof Pressable>>(null);

    const setOpen = (next: boolean) => {
        setOpenState(next);
        if (!next) setPath([]);
    };
    const submenu = path.at(-1);
    const entries = submenu?.children ?? items;
    const choice = !entries.every(
        (entry) => !('type' in entry) || entry.type === 'group' || entry.type === 'separator'
    );

    // A new level: keyboard (web) or screen reader focus on its first row
    useEffect(() => {
        if (!open || path.length === 0) return;
        focusElement(first.current);
    }, [open, path.length]);

    const setValue = (key: string, value: boolean | string) =>
        setChanged({ source: items, values: { ...values, [key]: value } });

    // The first row gets the focus when the sheet opens (a submenu: its back row)
    const firstKey = path.length > 0 ? undefined : firstRowKey(entries);
    const firstRef = (key: string) => (key === firstKey ? first : undefined);

    const renderEntry = (entry: MenuEntry, key: string | number): ReactNode => {
        if ('type' in entry && entry.type === 'separator') {
            const styles = menu();
            return <View key={key} role="separator" className={styles.separator()} />;
        }
        if ('type' in entry && entry.type === 'group') {
            const styles = menu();
            return (
                <View key={key} role="group" aria-label={entry.label}>
                    <Text className={styles.groupLabel()} aria-hidden>
                        {entry.label}
                    </Text>
                    {entry.items.map((child, index) => renderEntry(child, index))}
                </View>
            );
        }
        if ('type' in entry && entry.type === 'radio') {
            const styles = menu();
            const chosen = (values[radioKey(entry.name)] as string | undefined) ?? entry.value;
            return (
                <View key={key} role="radiogroup" aria-label={entry.label}>
                    {entry.label && (
                        <Text className={styles.groupLabel()} aria-hidden>
                            {entry.label}
                        </Text>
                    )}
                    {entry.items.map((item) => {
                        const checked = item.value === chosen;
                        const itemStyles = menu({ disabled: item.disabled });
                        return (
                            <Pressable
                                key={item.value}
                                ref={firstRef(`r:${entry.name}:${item.value}`)}
                                role="radio"
                                aria-checked={checked}
                                disabled={item.disabled}
                                aria-disabled={item.disabled || undefined}
                                className={itemStyles.item()}
                                onPress={() => {
                                    setValue(radioKey(entry.name), item.value);
                                    onValueChange?.(entry.name, item.value);
                                    if (item.closeOnSelect) setOpen(false);
                                }}
                            >
                                {item.icon && <Icon icon={item.icon} className={itemStyles.icon()} />}
                                <Text className={itemStyles.label()}>{item.label}</Text>
                                <View className={itemStyles.indicator()} aria-hidden>
                                    {checked && <Icon icon={Circle} filled className={itemStyles.indicatorIcon()} />}
                                </View>
                            </Pressable>
                        );
                    })}
                </View>
            );
        }
        if ('type' in entry && entry.type === 'checkbox') {
            const checked = (values[checkKey(entry.value)] as boolean | undefined) ?? !!entry.checked;
            const styles = menu({ disabled: entry.disabled });
            return (
                <Pressable
                    key={key}
                    ref={firstRef(`c:${entry.value}`)}
                    role="checkbox"
                    aria-checked={checked}
                    disabled={entry.disabled}
                    aria-disabled={entry.disabled || undefined}
                    className={styles.item()}
                    onPress={() => {
                        setValue(checkKey(entry.value), !checked);
                        onCheckedChange?.(entry.value, !checked);
                        if (entry.closeOnSelect) setOpen(false);
                    }}
                >
                    {entry.icon && <Icon icon={entry.icon} className={styles.icon()} />}
                    <Text className={styles.label()}>{entry.label}</Text>
                    <View className={styles.indicator()} aria-hidden>
                        {checked && <Icon icon={Check} className={styles.indicatorIcon()} />}
                    </View>
                </Pressable>
            );
        }
        const item = entry as MenuItem;
        const styles = menu({ danger: item.danger, disabled: item.disabled });
        const hasSubmenu = !!item.children?.length;
        return (
            <Pressable
                key={key}
                ref={firstRef(`i:${item.value}`)}
                role={choice ? 'button' : 'menuitem'}
                disabled={item.disabled}
                aria-disabled={item.disabled || undefined}
                {...(hasSubmenu ? { 'aria-haspopup': 'menu' } : {})}
                className={styles.item()}
                onPress={() => {
                    if (hasSubmenu) {
                        setPath([...path, item]);
                        return;
                    }
                    if (item.closeOnSelect !== false) setOpen(false);
                    onSelect?.(item.value);
                }}
            >
                {item.icon && <Icon icon={item.icon} className={styles.icon()} />}
                <Text className={styles.label()}>{item.label}</Text>
                {hasSubmenu && <Icon icon={ChevronRight} className={styles.chevron()} />}
            </Pressable>
        );
    };

    const styles = menu();
    return (
        <>
            {children && cloneElement(children, { onPress: () => setOpen(true) })}
            <Sheet
                open={open}
                onClose={() => setOpen(false)}
                title={submenu?.label ?? title ?? translations.menu.title}
                closeLabel={closeLabel ?? translations.common.close}
                // Checkbox and radio items are no menu items in React Native – the list is then a plain list
                listRole={choice ? undefined : 'menu'}
                onShow={() => {
                    if (Platform.OS === 'web') first.current?.focus();
                }}
            >
                {submenu && (
                    <Pressable
                        ref={first}
                        role={choice ? 'button' : 'menuitem'}
                        className={styles.back()}
                        onPress={() => setPath(path.slice(0, -1))}
                    >
                        <Icon icon={ChevronLeft} className={styles.chevron()} />
                        <Text className={styles.backLabel()}>{translations.pageHeader.back}</Text>
                    </Pressable>
                )}
                {entries.map((entry, index) => (
                    <Fragment key={index}>{renderEntry(entry, index)}</Fragment>
                ))}
            </Sheet>
        </>
    );
}
