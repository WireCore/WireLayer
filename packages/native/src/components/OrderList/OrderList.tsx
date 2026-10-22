import {
    filterListOptions,
    moveItem,
    orderList as orderListRecipe,
    orderSteps,
    orderStepTarget,
    toListOptions,
    type ItemAccessor,
    type ItemValueOf,
    type OrderStep,
} from '@wirecore/wirelayer-recipes/native';
import { Check, ChevronDown, ChevronsDown, ChevronsUp, ChevronUp } from 'lucide-react-native';
import { useEffect, useId, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { Platform, Pressable, ScrollView, Text, View, type AccessibilityActionEvent } from 'react-native';
import { useTranslations } from '../../locale.js';
import { useAnnouncer } from '../../utils/announce.js';
import { focusElement } from '../../utils/focus-registry.js';
import { Icon, type IconComponent } from '../../utils/Icon.js';
import { contains, type ListItemState } from '../../utils/options.js';
import { useControllable } from '../../utils/useControllable.js';
import { IconButton } from '../IconButton/IconButton.js';
import type { SelectItem } from '../Select/Select.js';
import { ListSearch } from './ListSearch.js';

export interface OrderListProps<T = SelectItem, V = ItemValueOf<T>> {
    /** Items in their order; SelectItem objects or any objects/values (see itemValue/itemLabel) */
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
    /** Content of an item (instead of icon and label) */
    renderItem?: (item: T, state: ListItemState) => ReactNode;
    className?: string;
}

const icons: Record<OrderStep, IconComponent> = {
    top: ChevronsUp,
    up: ChevronUp,
    down: ChevronDown,
    bottom: ChevronsDown,
};

/**
 * Choose an item (radio buttons), then move it with the buttons below – or with the screen reader actions of every
 * item ("Move to top", "Move up" …), on the web also with Alt + arrow keys. The new position is announced.
 */
export function OrderList<T = SelectItem, V = ItemValueOf<T>>({
    value,
    defaultValue = [],
    onValueChange,
    label,
    itemValue,
    itemLabel,
    itemDisabled,
    valueKey,
    filter = false,
    renderItem,
    className,
}: OrderListProps<T, V>) {
    const translations = useTranslations();
    const t = translations.orderList;
    const styles = orderListRecipe();
    const id = useId();
    const [items, setItems] = useControllable<T[]>(value, defaultValue, onValueChange);
    const options = toListOptions(items, { itemValue, itemLabel, itemDisabled, valueKey });
    const [chosen, setChosen] = useState<string | null>(null);
    const index = chosen === null ? -1 : options.findIndex((option) => option.key === chosen);
    const [query, setQuery] = useState('');
    const visible = filter ? filterListOptions(options, query, contains) : options;
    const { announce, region } = useAnnouncer();
    // A moved item keeps the focus (the web loses it when the element moves, iOS/Android keep the screen reader on it)
    const rows = useRef(new Map<string, ComponentRef<typeof Pressable>>());
    const [focusRequest, setFocusRequest] = useState<{ key: string } | null>(null);
    useEffect(() => {
        if (focusRequest) focusElement(rows.current.get(focusRequest.key) ?? null);
    }, [focusRequest]);

    const move = (from: number, step: OrderStep, refocus = false) => {
        const option = options[from];
        const to = orderStepTarget(step, from, items.length);
        if (!option || to === from) return;
        const next = moveItem(items, from, to);
        setItems(next);
        announce(t.moved(option.label, to + 1, next.length));
        if (refocus) setFocusRequest({ key: option.key });
    };
    // Web: Space chooses, Alt + arrow up/down moves the item
    const keys = (key: string, position: number): object =>
        Platform.OS === 'web'
            ? {
                  onKeyDown: (event: { key: string; altKey?: boolean; preventDefault(): void }) => {
                      if (event.key === ' ') {
                          event.preventDefault();
                          setChosen(key);
                          return;
                      }
                      if (!event.altKey || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) return;
                      event.preventDefault();
                      setChosen(key);
                      move(position, event.key === 'ArrowUp' ? 'up' : 'down', true);
                  },
              }
            : {};

    return (
        <View className={styles.base({ class: className })}>
            <Text nativeID={`${id}label`} className={styles.label()}>
                {label}
            </Text>
            {filter && <ListSearch value={query} onChangeText={setQuery} label={translations.pickList.filter(label)} />}
            <ScrollView className={styles.list()} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                {visible.length ? (
                    <View role="radiogroup" aria-labelledby={`${id}label`}>
                        {visible.map((option) => {
                            const position = options.indexOf(option);
                            const selected = option.key === chosen;
                            const parts = orderListRecipe({ selected });
                            const steps = option.disabled ? [] : orderSteps(position, items.length);
                            return (
                                <Pressable
                                    key={option.key}
                                    ref={(node) => {
                                        if (node) rows.current.set(option.key, node);
                                        else rows.current.delete(option.key);
                                    }}
                                    role="radio"
                                    aria-checked={selected}
                                    disabled={option.disabled}
                                    aria-disabled={option.disabled || undefined}
                                    className={parts.option()}
                                    onPress={() => setChosen(option.key)}
                                    accessibilityActions={steps.map((step) => ({ name: step, label: t[step] }))}
                                    onAccessibilityAction={(event: AccessibilityActionEvent) => {
                                        const step = steps.find((name) => name === event.nativeEvent.actionName);
                                        if (step) move(position, step, true);
                                    }}
                                    {...(option.disabled ? {} : keys(option.key, position))}
                                >
                                    {renderItem ? (
                                        renderItem(option.item, { selected, disabled: option.disabled })
                                    ) : (
                                        <>
                                            {!!option.icon && (
                                                <Icon icon={option.icon as IconComponent} className={parts.check()} />
                                            )}
                                            <Text className={parts.optionText()}>{option.label}</Text>
                                        </>
                                    )}
                                    {selected && <Icon icon={Check} className={parts.check()} />}
                                </Pressable>
                            );
                        })}
                    </View>
                ) : (
                    <Text role="status" className={styles.empty()}>
                        {query ? translations.common.noResults : translations.common.empty}
                    </Text>
                )}
            </ScrollView>
            <View className={styles.controls()}>
                {(['top', 'up', 'down', 'bottom'] as const).map((step) => (
                    <IconButton
                        key={step}
                        icon={icons[step]}
                        label={t[step]}
                        variant="text"
                        hitSlop={2}
                        disabled={!orderSteps(index, items.length).includes(step)}
                        onPress={() => move(index, step)}
                    />
                ))}
            </View>
            {region}
        </View>
    );
}
