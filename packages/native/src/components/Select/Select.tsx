import type { ItemValueOf } from '@wirecore/wirelayer-recipes/native';
import { useEffect, useState, type ReactNode } from 'react';
import { useTranslations } from '../../locale.js';
import { useAnnouncer } from '../../utils/announce.js';
import type { IconComponent } from '../../utils/Icon.js';
import { OptionSheet, useOptionList, type OptionListProps } from '../../utils/options.js';
import { PickerTrigger } from '../../utils/PickerTrigger.js';
import { useControllable } from '../../utils/useControllable.js';
import { useFieldControl } from '../Field/Field.js';

export interface SelectItem {
    value: string;
    label: string;
    /** Icon component shown in the option and in the trigger when selected */
    icon?: IconComponent;
    disabled?: boolean;
    /** Group heading – items are listed per group */
    group?: string;
}

export interface SelectProps<T = SelectItem, V = ItemValueOf<T>> extends OptionListProps<T, V> {
    /** Selected value; any type (string, number, boolean, object) */
    value?: V | null;
    defaultValue?: V | null;
    onValueChange?: (value: V | null) => void;
    placeholder?: string;
    /** Title of the sheet – default: the Field label or the placeholder */
    title?: string;
    /** Accessible name without a surrounding Field */
    'aria-label'?: string;
    /** Accessible name of the sheet's close button */
    closeLabel?: string;
    disabled?: boolean;
    invalid?: boolean;
    /** Search field at the top of the sheet; filters by label, ignoring case and accents */
    filter?: boolean;
    /** Button next to the field that clears the value */
    clearable?: boolean;
    /** Accessible name of the clear button (default "Clear selection") */
    clearLabel?: string;
    /** Height of the field: 32, 40 (default) or 48 pt */
    size?: 'sm' | 'md' | 'lg';
    /** Content of the field for the selected item (the accessible name stays its label) */
    renderValue?: (item: T) => ReactNode;
    className?: string;
}

/**
 * Picker: the trigger opens a sheet with the options as radio buttons. The trigger is named "Label: value",
 * so the current choice is read along. Items of any shape (itemValue/itemLabel), groups, a search field, server
 * data with paging at the end of the list.
 */
export function Select<T = SelectItem, V = ItemValueOf<T>>(props: SelectProps<T, V>) {
    const {
        value,
        defaultValue = null,
        onValueChange,
        placeholder: placeholderProp,
        title,
        'aria-label': ariaLabel,
        closeLabel,
        disabled,
        invalid,
        filter = false,
        clearable = false,
        clearLabel,
        size,
        renderValue,
        renderItem,
        loadingText,
        emptyText,
        className,
    } = props;
    const translations = useTranslations();
    const placeholder = placeholderProp ?? translations.common.placeholder;
    const control = useFieldControl({ invalid, disabled });
    const [selected, setSelected] = useControllable<V | null>(value, defaultValue, onValueChange);
    const [open, setOpen] = useState(false);
    // null, undefined and "" (an empty form field) are no choice
    const list = useOptionList<T, V>(
        props,
        selected === null || selected === undefined || selected === '' ? [] : [selected]
    );
    const current = list.selected[0];
    const label = control.label ?? ariaLabel;
    const { announce, region } = useAnnouncer();
    const close = () => {
        setOpen(false);
        if (list.query) list.setQuery('');
    };
    useEffect(() => {
        if (open && list.announcement) announce(list.announcement);
    }, [open, list.announcement, announce]);

    return (
        <>
            <PickerTrigger
                label={label}
                text={current?.label}
                icon={current?.icon as IconComponent | undefined}
                content={current && renderValue ? renderValue(current.item) : undefined}
                placeholder={placeholder}
                open={open}
                invalid={control.invalid}
                disabled={control.disabled}
                controlProps={control.props}
                controlId={control.controlId}
                onPress={() => setOpen(true)}
                size={size}
                loading={!!props.loading && !open}
                onClear={clearable ? () => setSelected(null) : undefined}
                clearLabel={clearLabel ?? translations.select.clear}
                className={className}
            />
            <OptionSheet<T>
                open={open}
                onClose={close}
                title={title ?? label ?? placeholder}
                closeLabel={closeLabel}
                list={list}
                filter={filter}
                isSelected={(option) => option.key === current?.key}
                onSelect={(option) => {
                    list.remember([option]);
                    setSelected(option.value as V);
                    close();
                }}
                renderItem={renderItem}
                loadingText={loadingText}
                emptyText={emptyText}
            />
            {region}
        </>
    );
}
