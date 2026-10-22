import {
    allListOptionsState,
    checkbox,
    select,
    toggleAllListOptions,
    type ItemValueOf,
    type ListOption,
} from '@wirecore/wirelayer-recipes/native';
import { Check, Minus } from 'lucide-react-native';
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslations } from '../../locale.js';
import { useAnnouncer } from '../../utils/announce.js';
import { Icon } from '../../utils/Icon.js';
import { toggleOnSpace } from '../../utils/keyboard.js';
import { OptionSheet, useOptionList, type OptionListProps } from '../../utils/options.js';
import { PickerTrigger } from '../../utils/PickerTrigger.js';
import { useControllable } from '../../utils/useControllable.js';
import { useFieldControl } from '../Field/Field.js';
import type { SelectItem } from '../Select/Select.js';

export interface MultiSelectProps<T = SelectItem, V = ItemValueOf<T>> extends OptionListProps<T, V> {
    /** Selected values; any type (string, number, boolean, object) */
    value?: V[];
    defaultValue?: V[];
    onValueChange?: (value: V[]) => void;
    placeholder?: string;
    /** Up to this many labels in the trigger, then the summary */
    maxShown?: number;
    /** Trigger text once more than `maxShown` items are selected, e.g. "4 selected" */
    summary?: (count: number) => string;
    /** Title of the sheet – default: the Field label or the placeholder */
    title?: string;
    /** Accessible name without a surrounding Field */
    'aria-label'?: string;
    closeLabel?: string;
    disabled?: boolean;
    invalid?: boolean;
    /** Selected items as text (default) or as chips in the field (the sheet removes them) */
    display?: 'text' | 'chips';
    /** Check boxes before the options (default); false shows a check mark after the label */
    checkboxes?: boolean;
    /** "Select all" above the options – takes the options in view (filtered, enabled) */
    selectAll?: boolean;
    /** Most options that can be chosen; the others are disabled then and the limit is announced */
    max?: number;
    /** Button next to the field that clears all values */
    clearable?: boolean;
    /** Accessible name of the clear button (default "Clear selection") */
    clearLabel?: string;
    /** Search field at the top of the sheet; filters by label, ignoring case and accents */
    filter?: boolean;
    /** Height of the field: 32, 40 (default) or 48 pt */
    size?: 'sm' | 'md' | 'lg';
    /** Content of the field for the selected items (display "text") */
    renderValue?: (items: T[]) => ReactNode;
    className?: string;
}

/** Several choices: the trigger opens a sheet of checkboxes, every tap changes the value at once */
export function MultiSelect<T = SelectItem, V = ItemValueOf<T>>(props: MultiSelectProps<T, V>) {
    const {
        value,
        defaultValue = [],
        onValueChange,
        placeholder,
        maxShown = 2,
        summary,
        title,
        'aria-label': ariaLabel,
        closeLabel,
        disabled,
        invalid,
        display = 'text',
        checkboxes = true,
        selectAll = false,
        max,
        clearable = false,
        clearLabel,
        filter = false,
        size,
        renderValue,
        renderItem,
        loadingText,
        emptyText,
        className,
    } = props;
    const translations = useTranslations();
    const t = translations.select;
    const control = useFieldControl({ invalid, disabled });
    const [selected, setSelected] = useControllable<V[]>(value, defaultValue, onValueChange);
    const [open, setOpen] = useState(false);
    const list = useOptionList<T, V>(props, selected);
    const chosen = list.selected;
    const label = control.label ?? ariaLabel;
    const atMax = max !== undefined && chosen.length >= max;
    const { announce, region } = useAnnouncer();
    // The field lists the chosen items in the order of the items (unknown ones at the end)
    const rank = (option: ListOption<T>) => {
        const index = list.options.findIndex((entry) => entry.key === option.key);
        return index < 0 ? Infinity : index;
    };
    const ordered = [...chosen].sort((a, b) => rank(a) - rank(b));
    const text = !chosen.length
        ? undefined
        : display === 'text' && chosen.length > maxShown
          ? (summary ?? translations.common.selectedCount)(chosen.length)
          : // Chips: the name lists them like they show (separate words), the text as a list
            ordered.map((option) => option.label).join(display === 'chips' ? ' ' : ', ');
    const apply = (next: ListOption<T>[]) => {
        list.remember(next);
        setSelected(next.map((option) => option.value as V));
        if (max !== undefined && next.length >= max && chosen.length < max) announce(t.maxReached(max));
    };
    const toggle = (option: ListOption<T>) =>
        apply(
            chosen.some((entry) => entry.key === option.key)
                ? chosen.filter((entry) => entry.key !== option.key)
                : [...chosen, option]
        );
    const close = () => {
        setOpen(false);
        if (list.query) list.setQuery('');
    };
    useEffect(() => {
        if (open && list.announcement) announce(list.announcement);
    }, [open, list.announcement, announce]);

    const allState = allListOptionsState(chosen, list.visible);
    const styles = select({ selected: allState === true });
    const box = checkbox({ checked: allState !== false });
    const toggleAll = () => apply(toggleAllListOptions(chosen, list.visible, max));

    return (
        <>
            <PickerTrigger
                label={label}
                text={text}
                chips={display === 'chips' ? ordered.map((option) => option.label) : undefined}
                content={
                    chosen.length && renderValue && display === 'text'
                        ? renderValue(chosen.map((option) => option.item))
                        : undefined
                }
                placeholder={placeholder ?? translations.common.placeholder}
                open={open}
                invalid={control.invalid}
                disabled={control.disabled}
                controlProps={control.props}
                controlId={control.controlId}
                onPress={() => setOpen(true)}
                size={size}
                loading={!!props.loading && !open}
                onClear={clearable ? () => setSelected([]) : undefined}
                clearLabel={clearLabel ?? t.clear}
                className={className}
            />
            <OptionSheet<T>
                open={open}
                onClose={close}
                title={title ?? label ?? placeholder ?? translations.common.placeholder}
                closeLabel={closeLabel}
                list={list}
                multiple
                checkboxes={checkboxes}
                filter={filter}
                hint={max !== undefined ? t.maxReached(max) : undefined}
                isSelected={(option) => chosen.some((entry) => entry.key === option.key)}
                isBlocked={() => atMax}
                onSelect={toggle}
                renderItem={renderItem}
                loadingText={loadingText}
                emptyText={emptyText}
                header={
                    selectAll && list.visible.length > 0 ? (
                        <View className={styles.selectAll()}>
                            <Pressable
                                role="checkbox"
                                aria-checked={allState}
                                className={styles.option()}
                                onPress={toggleAll}
                                {...toggleOnSpace(toggleAll)}
                            >
                                <View className={box.control({ class: styles.optionBox() })}>
                                    {allState !== false && (
                                        <Icon icon={allState === true ? Check : Minus} className={box.icon()} />
                                    )}
                                </View>
                                <Text className={styles.optionText()}>{t.selectAll}</Text>
                            </Pressable>
                        </View>
                    ) : undefined
                }
            />
            {region}
        </>
    );
}
