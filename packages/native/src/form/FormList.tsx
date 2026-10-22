import { useStore, type AnyFieldApi } from '@tanstack/react-form';
import { formList } from '@wirecore/wirelayer-recipes/native';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react-native';
import { useEffect, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button } from '../components/Button/Button.js';
import { IconButton } from '../components/IconButton/IconButton.js';
import { useTranslations } from '../locale.js';
import { useAnnouncer } from '../utils/announce.js';
import { focusElement } from '../utils/focus-registry.js';

export interface FormListItemProps {
    index: number;
    /** Name of the entry, e.g. "Contact 2" */
    itemLabel: string;
    remove: () => void;
    moveUp: () => void;
    moveDown: () => void;
}

export interface FormListProps {
    /** The TanStack Form field of the array (`<form.Field name="contacts" mode="array">`) */
    field: AnyFieldApi;
    /** Visible name of the list, e.g. "Contacts" */
    label: string;
    /** The value of a new entry, e.g. `() => ({ name: '', email: '' })` */
    newItem: () => unknown;
    /** One entry: its fields (e.g. `<form.Field name={`contacts[${index}].name`}>`) */
    renderItem: (props: FormListItemProps) => ReactNode;
    /** Name of an entry by position (1-based), e.g. (n) => `Contact ${n}` – names the buttons and announcements */
    itemLabel?: (position: number) => string;
    /** Text of the add button (default "Add entry") */
    addLabel?: string;
    /** Fewest entries: remove is disabled at this count */
    min?: number;
    /** Most entries: add is disabled at this count */
    max?: number;
    /** Up/down buttons and the screen reader actions "Move up"/"Move down" (default true) */
    reorderable?: boolean;
    className?: string;
}

/**
 * Repeated entries of a form: numbered cards with move up/down and remove (also as screen reader actions on the
 * card), an add button, min/max limits; changes are announced and the screen reader focus follows the entry.
 */
export function FormList({
    field,
    label,
    newItem,
    renderItem,
    itemLabel,
    addLabel,
    min = 0,
    max,
    reorderable = true,
    className,
}: FormListProps) {
    const t = useTranslations().formList;
    const styles = formList();
    const value = useStore(field.store, (state) => state.value as unknown[] | undefined) ?? [];
    const count = value.length;
    const atMax = max !== undefined && count >= max;
    const atMin = count <= min;
    const { announce, region } = useAnnouncer();
    const itemName = (index: number) => (itemLabel ?? t.item)(index + 1);
    const headings = useRef<(ComponentRef<typeof Text> | null)[]>([]);
    const addButton = useRef<ComponentRef<typeof Pressable>>(null);
    // The entry (its heading) or the add button gets the focus once the list has updated – a new object per request
    const [focusTarget, setFocusTarget] = useState<{ index: number } | null>(null);
    useEffect(() => {
        if (!focusTarget) return;
        focusElement(focusTarget.index < 0 ? addButton.current : (headings.current[focusTarget.index] ?? null));
    }, [focusTarget]);

    const add = () => {
        if (atMax) return;
        field.pushValue(newItem());
        announce(t.added(itemName(count)));
        setFocusTarget({ index: count });
    };
    const remove = (index: number) => {
        if (atMin) return;
        field.removeValue(index);
        announce(t.removed(itemName(index)));
        setFocusTarget({ index: count > 1 ? Math.min(index, count - 2) : -1 });
    };
    const move = (index: number, step: -1 | 1) => {
        const target = index + step;
        if (target < 0 || target >= count) return;
        field.moveValue(index, target);
        announce(t.moved(itemName(index), target + 1));
        setFocusTarget({ index: target });
    };
    const hint = [min > 0 ? t.min(min) : '', max !== undefined ? t.max(max) : ''].filter(Boolean).join(' · ');

    return (
        <View role="group" aria-label={label} className={styles.base({ class: className })}>
            <Text className={styles.legend()}>{label}</Text>
            <View role="list" className={styles.list()}>
                {value.map((_, index) => {
                    const name = itemName(index);
                    const actions = [
                        ...(reorderable && index > 0 ? [{ name: 'moveUp', label: t.moveUp(name) }] : []),
                        ...(reorderable && index < count - 1 ? [{ name: 'moveDown', label: t.moveDown(name) }] : []),
                        ...(!atMin ? [{ name: 'remove', label: t.remove(name) }] : []),
                    ];
                    return (
                        <View key={index} role="listitem" className={styles.item()}>
                            <View className={styles.itemHeader()}>
                                {/* The heading carries the entry's actions for the screen reader rotor */}
                                <Text
                                    ref={(node) => {
                                        headings.current[index] = node;
                                    }}
                                    role="heading"
                                    className={styles.index()}
                                    accessibilityActions={actions}
                                    onAccessibilityAction={(event) => {
                                        const action = event.nativeEvent.actionName;
                                        if (action === 'moveUp') move(index, -1);
                                        if (action === 'moveDown') move(index, 1);
                                        if (action === 'remove') remove(index);
                                    }}
                                    {...({ tabIndex: -1 } as object)}
                                >
                                    {name}
                                </Text>
                                <View className={styles.actions()}>
                                    {reorderable && (
                                        <>
                                            <IconButton
                                                icon={ArrowUp}
                                                label={t.moveUp(name)}
                                                variant="text"
                                                size="sm"
                                                disabled={index === 0}
                                                onPress={() => move(index, -1)}
                                            />
                                            <IconButton
                                                icon={ArrowDown}
                                                label={t.moveDown(name)}
                                                variant="text"
                                                size="sm"
                                                disabled={index === count - 1}
                                                onPress={() => move(index, 1)}
                                            />
                                        </>
                                    )}
                                    <IconButton
                                        icon={Trash2}
                                        label={t.remove(name)}
                                        variant="text"
                                        size="sm"
                                        disabled={atMin}
                                        onPress={() => remove(index)}
                                    />
                                </View>
                            </View>
                            <View className={styles.body()}>
                                {renderItem({
                                    index,
                                    itemLabel: name,
                                    remove: () => remove(index),
                                    moveUp: () => move(index, -1),
                                    moveDown: () => move(index, 1),
                                })}
                            </View>
                        </View>
                    );
                })}
            </View>
            <View className={styles.footer()}>
                <Button ref={addButton} variant="outline" size="sm" leadingIcon={Plus} disabled={atMax} onPress={add}>
                    {addLabel ?? t.add}
                </Button>
                {!!hint && <Text className={styles.hint()}>{hint}</Text>}
            </View>
            {region}
        </View>
    );
}
