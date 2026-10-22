import {
    listValueKey,
    orderList as orderListRecipe,
    toListOption,
    type ItemAccessor,
    type ItemValueOf,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { ChevronDown, ChevronsDown, ChevronsUp, ChevronUp } from 'lucide-react';
import { useState, type CSSProperties, type DragEvent, type KeyboardEvent, type ReactNode } from 'react';
import { IconButton } from '../IconButton/IconButton.js';
import { Listbox, type ListboxItem } from '../Listbox/Listbox.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';
import { letDrag, type ListItemState } from '../Select/list.js';

export interface OrderListProps<T = ListboxItem, V = ItemValueOf<T>> {
    /** Items in their order; ListboxItem objects or any objects/values (see itemValue/itemLabel) */
    value?: T[];
    defaultValue?: T[];
    onValueChange?: (items: T[]) => void;
    /** Visible label of the list */
    label: string;
    /** Value of an item: property name or function (default: `value`, otherwise the item itself) */
    itemValue?: ItemAccessor<T, V>;
    /** Label of an item: property name or function (default: `label`) */
    itemLabel?: ItemAccessor<T, string>;
    /** Disabled state of an item: property name or function (default: `disabled`) */
    itemDisabled?: ItemAccessor<T, boolean>;
    /** Identifies object values (property name or function), e.g. "id" – without it objects are compared by content */
    valueKey?: ItemAccessor<V, string | number>;
    /** A search field above the list (moving works on the whole list) */
    filter?: boolean;
    /** Items can be dragged to another place (the buttons and Alt + arrow keys stay the keyboard way) */
    draggable?: boolean;
    /** Content of an item (instead of icon and label) */
    renderItem?: (item: T, state: ListItemState) => ReactNode;
    className?: string;
    style?: CSSProperties;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof orderListRecipe>;
}

/** Choose an item, then move it with the buttons (or Alt + arrow keys); the new position is announced */
export function OrderList<T = ListboxItem, V = ItemValueOf<T>>({
    classes,
    value,
    defaultValue = [],
    onValueChange,
    label,
    itemValue,
    itemLabel,
    itemDisabled,
    valueKey,
    filter = false,
    draggable = false,
    renderItem,
    className,
    style,
}: OrderListProps<T, V>) {
    const orderList = useRecipe('orderList', orderListRecipe, classes);
    const styles = orderList();
    const translations = useTranslations();
    const t = translations.orderList;
    const accessors = { itemValue, itemLabel, itemDisabled, valueKey };
    const [internal, setInternal] = useState(defaultValue);
    const items = value ?? internal;
    const options = items.map((item) => toListOption(item, accessors));
    const [selected, setSelected] = useState<V[]>([]);
    const [status, setStatus] = useState('');
    const keyOf = (entry: unknown) => listValueKey(entry, valueKey);
    const index = selected.length ? options.findIndex((option) => option.key === keyOf(selected[0])) : -1;

    const moveFrom = (from: number, to: number) => {
        if (from < 0) return;
        const target = Math.max(0, Math.min(items.length - 1, to));
        if (target === from) return;
        const next = [...items];
        const [item] = next.splice(from, 1);
        next.splice(target, 0, item!);
        setInternal(next);
        onValueChange?.(next);
        setStatus(t.moved(options[from]!.label, target + 1, next.length));
    };
    const move = (to: number) => moveFrom(index, to);
    // Alt + arrow keys move the chosen item right in the list
    const onKey = (event: KeyboardEvent) => {
        if (!event.altKey || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) return;
        event.preventDefault();
        move(index + (event.key === 'ArrowUp' ? -1 : 1));
    };

    // Dragging: the item goes to the place of the item it is dropped on
    const [dragKey, setDragKey] = useState<string | null>(null);
    const [dropping, setDropping] = useState(false);
    const indexOfKey = (key: string | undefined) => options.findIndex((option) => option.key === key);
    const itemKey = (event: DragEvent) =>
        (event.target as HTMLElement).closest<HTMLElement>('[data-part="item"]')?.dataset.value;
    const endDrag = () => {
        setDragKey(null);
        setDropping(false);
    };

    return (
        <div className={styles.base({ class: className })} style={style}>
            <div
                className={styles.list({ class: draggable ? styles.dropZone() : undefined })}
                data-drop={dropping || undefined}
                onKeyDown={onKey}
                onMouseDownCapture={letDrag}
                onDragStart={(event) => {
                    const key = itemKey(event);
                    if (key === undefined) return;
                    setDragKey(key);
                    event.dataTransfer.setData('text/plain', options[indexOfKey(key)]?.label ?? key);
                    event.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(event) => {
                    if (dragKey === null) return;
                    event.preventDefault();
                    setDropping(true);
                }}
                onDragLeave={() => setDropping(false)}
                onDrop={(event) => {
                    if (dragKey === null) return;
                    event.preventDefault();
                    const to = indexOfKey(itemKey(event));
                    moveFrom(indexOfKey(dragKey), to < 0 ? items.length - 1 : to);
                    endDrag();
                }}
                onDragEnd={endDrag}
            >
                <Listbox
                    items={items}
                    label={label}
                    {...accessors}
                    filter={filter}
                    draggableItems={draggable}
                    renderItem={renderItem}
                    value={selected}
                    onValueChange={setSelected}
                />
            </div>
            <div className={styles.controls()}>
                <IconButton icon={ChevronsUp} label={t.top} size="sm" disabled={index <= 0} onClick={() => move(0)} />
                <IconButton
                    icon={ChevronUp}
                    label={t.up}
                    size="sm"
                    disabled={index <= 0}
                    onClick={() => move(index - 1)}
                />
                <IconButton
                    icon={ChevronDown}
                    label={t.down}
                    size="sm"
                    disabled={index < 0 || index === items.length - 1}
                    onClick={() => move(index + 1)}
                />
                <IconButton
                    icon={ChevronsDown}
                    label={t.bottom}
                    size="sm"
                    disabled={index < 0 || index === items.length - 1}
                    onClick={() => move(items.length - 1)}
                />
            </div>
            <p role="status" className={styles.status()}>
                {status}
            </p>
        </div>
    );
}
