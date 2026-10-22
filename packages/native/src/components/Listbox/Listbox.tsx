import {
    allListOptionsState,
    checkbox,
    input,
    listbox,
    select,
    toggleAllListOptions,
    type ItemValueOf,
    type ListOption,
} from '@wirecore/wirelayer-recipes/native';
import { Check, Minus, Search } from 'lucide-react-native';
import { useEffect, useId } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useResolveClassNames } from 'uniwind';
import { useLocale } from '../../locale.js';
import { useAnnouncer } from '../../utils/announce.js';
import { Icon, type IconComponent } from '../../utils/Icon.js';
import { toggleOnSpace } from '../../utils/keyboard.js';
import { Loader } from '../../utils/Loader.js';
import { useOptionList, type OptionListProps } from '../../utils/options.js';
import { useControllable } from '../../utils/useControllable.js';
import type { SelectItem } from '../Select/Select.js';

export interface ListboxProps<T = SelectItem, V = ItemValueOf<T>> extends OptionListProps<T, V> {
    /** Visible label, also the list's accessible name */
    label?: string;
    /** Accessible name without a visible label */
    'aria-label'?: string;
    /** Several options can be chosen (checkboxes) */
    multiple?: boolean;
    /** Chosen values; any type (string, number, boolean, object) */
    value?: V[];
    defaultValue?: V[];
    onValueChange?: (value: V[]) => void;
    disabled?: boolean;
    invalid?: boolean;
    /** Search field above the list; filters by label, ignoring case and accents */
    filter?: boolean;
    /** Check boxes before the options (`multiple`, default) – false shows a check mark */
    checkboxes?: boolean;
    /** "Select all" above the options (`multiple`) – takes the options in view (filtered, enabled) */
    selectAll?: boolean;
    className?: string;
}

/**
 * Always visible list of options: radio buttons (one value) or checkboxes (`multiple`) – the selection states screen
 * readers announce on iOS and Android. Scrolls inside its box; its end (or "Load more") loads more.
 */
export function Listbox<T = SelectItem, V = ItemValueOf<T>>(props: ListboxProps<T, V>) {
    const {
        label,
        'aria-label': ariaLabel,
        multiple = false,
        value,
        defaultValue = [],
        onValueChange,
        disabled = false,
        invalid = false,
        filter = false,
        checkboxes = true,
        selectAll = false,
        renderItem,
        loadingText,
        emptyText,
        className,
    } = props;
    const { translations } = useLocale();
    const [selected, setSelected] = useControllable<V[]>(value, defaultValue, onValueChange);
    const list = useOptionList<T, V>(props, selected);
    const id = useId();
    const styles = listbox({ invalid, disabled });
    const rows = select();
    const field = input({ hasIcon: true });
    const muted = useResolveClassNames('text-muted');
    const { announce, region } = useAnnouncer();
    const { open } = list;
    // The list is visible from the start: load the first page right away
    useEffect(() => open(), [open]);
    useEffect(() => {
        if (list.announcement) announce(list.announcement);
    }, [list.announcement, announce]);
    const isSelected = (option: ListOption<T>) => list.selected.some((entry) => entry.key === option.key);
    const choose = (option: ListOption<T>) => {
        const next = multiple
            ? isSelected(option)
                ? list.selected.filter((entry) => entry.key !== option.key)
                : [...list.selected, option]
            : [option];
        list.remember(next);
        setSelected(next.map((entry) => entry.value as V));
    };
    const allState = allListOptionsState(list.selected, list.visible);
    const toggleAll = () => {
        const next = toggleAllListOptions(list.selected, list.visible);
        list.remember(next);
        setSelected(next.map((entry) => entry.value as V));
    };
    const option = (entry: ListOption<T>) => {
        const checked = isSelected(entry);
        const off = disabled || entry.disabled;
        const box = checkbox({ checked });
        const showBox = multiple && checkboxes;
        return (
            <Pressable
                key={entry.key}
                role={multiple ? 'checkbox' : 'radio'}
                aria-checked={checked}
                disabled={off}
                aria-disabled={off || undefined}
                className={select({ selected: checked }).option()}
                onPress={() => choose(entry)}
                {...(off ? {} : toggleOnSpace(() => choose(entry)))}
            >
                {showBox && (
                    <View className={box.control({ class: rows.optionBox() })}>
                        {checked && <Icon icon={Check} className={box.icon()} />}
                    </View>
                )}
                {renderItem ? (
                    renderItem(entry.item, { selected: checked, disabled: off })
                ) : (
                    <>
                        {!!entry.icon && <Icon icon={entry.icon as IconComponent} className={rows.icon()} />}
                        <Text className={rows.optionText()}>{entry.label}</Text>
                    </>
                )}
                {!showBox && checked && <Icon icon={Check} className={rows.optionCheck()} />}
            </Pressable>
        );
    };

    return (
        <View className={styles.base({ class: className })}>
            {!!label && (
                <Text nativeID={`${id}label`} className={styles.label()}>
                    {label}
                </Text>
            )}
            {filter && (
                <View className={field.base()}>
                    <Icon icon={Search} className={field.icon()} />
                    <TextInput
                        value={list.query}
                        onChangeText={list.setQuery}
                        aria-label={translations.select.filter}
                        placeholder={translations.combobox.search}
                        placeholderTextColor={typeof muted.color === 'string' ? muted.color : undefined}
                        autoCorrect={false}
                        autoCapitalize="none"
                        editable={!disabled}
                        className={field.control()}
                    />
                </View>
            )}
            <ScrollView
                className={styles.list()}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
                scrollEventThrottle={100}
                onScroll={({ nativeEvent }) => {
                    const end = nativeEvent.contentOffset.y + nativeEvent.layoutMeasurement.height;
                    if (end >= nativeEvent.contentSize.height - 48 && list.hasMore && !list.loading) list.loadMore();
                }}
            >
                {multiple && selectAll && list.visible.length > 0 && (
                    <Pressable
                        role="checkbox"
                        aria-checked={allState}
                        disabled={disabled}
                        className={rows.option()}
                        onPress={toggleAll}
                        {...(disabled ? {} : toggleOnSpace(toggleAll))}
                    >
                        <View
                            className={checkbox({ checked: allState !== false }).control({ class: rows.optionBox() })}
                        >
                            {allState !== false && (
                                <Icon
                                    icon={allState === true ? Check : Minus}
                                    className={checkbox({ checked: true }).icon()}
                                />
                            )}
                        </View>
                        <Text className={rows.optionText()}>{translations.select.selectAll}</Text>
                    </Pressable>
                )}
                <View
                    role={list.visible.length ? (multiple ? 'group' : 'radiogroup') : undefined}
                    aria-labelledby={label ? `${id}label` : undefined}
                    aria-label={label ? undefined : ariaLabel}
                    aria-busy={list.loading || undefined}
                    {...({ 'aria-invalid': invalid || undefined } as object)}
                >
                    {list.groups.map((group, index) => (
                        <View key={group.label ?? `group-${index}`}>
                            {group.label && (
                                <Text role="heading" className={rows.groupLabel()}>
                                    {group.label}
                                </Text>
                            )}
                            {group.options.map(option)}
                        </View>
                    ))}
                </View>
                {list.loading ? (
                    <View className={rows.status()} role="status">
                        <Loader className={rows.spinner()} />
                        <Text className={rows.statusText()}>{loadingText ?? translations.common.loading}</Text>
                    </View>
                ) : list.hasMore ? (
                    <Pressable role="button" className={rows.option()} onPress={list.loadMore}>
                        <Text className={rows.optionText()}>{translations.dataSource.loadMore}</Text>
                    </Pressable>
                ) : (
                    !list.visible.length && (
                        <Text role="status" className={rows.statusText({ class: rows.status() })}>
                            {list.emptyText ??
                                emptyText ??
                                (list.query ? translations.common.noResults : translations.common.empty)}
                        </Text>
                    )
                )}
            </ScrollView>
            {region}
        </View>
    );
}
