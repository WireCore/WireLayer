import { tagsInput, type DataSource } from '@wirecore/wirelayer-recipes/native';
import { X } from 'lucide-react-native';
import { useEffect, useId, useRef, useState, type ComponentRef } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useResolveClassNames } from 'uniwind';
import { useLocale } from '../../locale.js';
import { useAnnouncer } from '../../utils/announce.js';
import { Icon } from '../../utils/Icon.js';
import { InlineOptions, inlineOptionId } from '../../utils/InlineOptions.js';
import { useOptionList } from '../../utils/options.js';
import { useControllable } from '../../utils/useControllable.js';
import { useFocusWithin } from '../../utils/useFocusWithin.js';
import { useFieldControl } from '../Field/Field.js';

export interface TagsInputProps {
    value?: string[];
    defaultValue?: string[];
    onValueChange?: (value: string[]) => void;
    placeholder?: string;
    /** Most entries allowed */
    max?: number;
    /** Characters that finish an entry besides Enter (default ",") */
    delimiter?: string;
    /** Accept a check, e.g. for e-mail addresses */
    validate?: (value: string) => boolean;
    disabled?: boolean;
    invalid?: boolean;
    /** Suggestions while typing (entries already added are left out); a tap adds one */
    suggestions?: readonly string[];
    /** Filters the suggestions by the typed text, ignoring case and accents (default true) */
    filter?: boolean;
    /** The suggestions are filtered elsewhere (server): no local filtering, listen to onFilterChange */
    manualFilter?: boolean;
    /** Typed text – e.g. to load matching suggestions from a server (manualFilter) */
    onFilterChange?: (text: string) => void;
    /** Shows "Loading" in the suggestions (aria-busy) */
    loading?: boolean;
    /** Text of the loading row */
    loadingText?: string;
    /** More suggestions can be loaded: "Load more" calls onLoadMore */
    hasMore?: boolean;
    onLoadMore?: () => void;
    /** Suggestions from a server instead of `suggestions`: asked with the typed text after a typing pause */
    dataSource?: DataSource<string>;
    /** Fewest characters the typed text needs before the data source is asked (default 1) */
    minSearchLength?: number;
    /** Accessible name without a surrounding Field */
    'aria-label'?: string;
    className?: string;
}

/**
 * Free entries as chips: the return key or the delimiter adds, Backspace on the empty field selects the last entry
 * (again removes it); every chip has a remove button. Additions and removals are announced.
 */
export function TagsInput({
    value,
    defaultValue = [],
    onValueChange,
    placeholder,
    max,
    delimiter = ',',
    validate,
    disabled,
    invalid,
    suggestions,
    filter = true,
    manualFilter,
    onFilterChange,
    loading,
    loadingText,
    hasMore,
    onLoadMore,
    dataSource,
    minSearchLength = 1,
    'aria-label': ariaLabel,
    className,
}: TagsInputProps) {
    const { translations } = useLocale();
    const t = translations.tagsInput;
    const control = useFieldControl({ invalid, disabled });
    const [tags, setTags] = useControllable(value, defaultValue, onValueChange);
    const [text, setText] = useState('');
    const { focused, onFocus, onBlur } = useFocusWithin();
    const [selected, setSelected] = useState(-1);
    const [highlighted, setHighlighted] = useState(-1);
    const field = useRef<ComponentRef<typeof TextInput>>(null);
    const muted = useResolveClassNames('text-muted');
    const listId = `${useId()}suggestions`;
    const { announce, region } = useAnnouncer();
    const full = max !== undefined && tags.length >= max;
    const styles = tagsInput({ focused, invalid: control.invalid, disabled: control.disabled });
    const withSuggestions = !!suggestions || !!dataSource;
    const list = useOptionList<string, string>(
        {
            items: suggestions ?? [],
            dataSource,
            minSearchLength,
            manualFilter: manualFilter || !filter,
            onFilterChange,
            loading,
            hasMore,
            onLoadMore,
        },
        []
    );
    const options = list.visible.filter((option) => !tags.includes(option.label)).slice(0, 8);
    const showList =
        withSuggestions && focused && !full && (text.length >= (dataSource ? minSearchLength : 1) || list.loading);
    useEffect(() => {
        if (focused && list.announcement) announce(list.announcement);
    }, [focused, list.announcement, announce]);

    const add = (entry: string) => {
        const clean = entry.trim();
        if (!clean || full || tags.includes(clean) || (validate && !validate(clean))) return false;
        setTags([...tags, clean]);
        announce(t.tagAdded(clean));
        setText('');
        list.setQuery('');
        setHighlighted(-1);
        return true;
    };
    const remove = (index: number) => {
        const entry = tags[index]!;
        setTags(tags.filter((_, position) => position !== index));
        announce(t.tagDeleted(entry));
        setSelected(-1);
        field.current?.focus();
    };
    const type = (next: string) => {
        setSelected(-1);
        // A pasted list ("a, b, c") or the delimiter adds entries
        if (delimiter && next.includes(delimiter)) {
            const parts = next.split(delimiter);
            const rest = parts.pop() ?? '';
            const added = parts.map((part) => part.trim()).filter((part) => part && !tags.includes(part));
            if (added.length) {
                const room = max === undefined ? added.length : Math.max(0, max - tags.length);
                const accepted = added.filter((part) => !validate || validate(part)).slice(0, room);
                if (accepted.length) {
                    setTags([...tags, ...accepted]);
                    announce(accepted.length > 1 ? t.tagsPasted(accepted) : t.tagAdded(accepted[0]!));
                }
            }
            setText(rest);
            list.setQuery(rest);
            return;
        }
        setText(next);
        list.setQuery(next);
        setHighlighted(-1);
    };

    return (
        <View className={className}>
            <View className={styles.base()}>
                {tags.map((tag, index) => {
                    const look = tagsInput({ selected: index === selected });
                    return (
                        <View key={tag} className={look.tag()}>
                            <Text className={look.tagText()}>{tag}</Text>
                            <Pressable
                                role="button"
                                aria-label={t.deleteTagTriggerLabel(tag)}
                                disabled={control.disabled}
                                className={look.tagRemove()}
                                onPress={() => remove(index)}
                            >
                                <Icon icon={X} className={look.tagRemoveIcon()} />
                            </Pressable>
                        </View>
                    );
                })}
                <TextInput
                    ref={field}
                    {...control.props}
                    aria-label={control.label ?? ariaLabel}
                    role={withSuggestions ? 'combobox' : undefined}
                    aria-expanded={withSuggestions ? showList : undefined}
                    {...({
                        'aria-controls': showList ? listId : undefined,
                        'aria-activedescendant':
                            showList && highlighted >= 0 ? inlineOptionId(listId, highlighted) : undefined,
                    } as object)}
                    value={text}
                    placeholder={tags.length ? undefined : placeholder}
                    placeholderTextColor={typeof muted.color === 'string' ? muted.color : undefined}
                    editable={!control.disabled && !full}
                    aria-disabled={control.disabled || undefined}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    submitBehavior="submit"
                    className={styles.control()}
                    onChangeText={type}
                    onSubmitEditing={() => {
                        const option = highlighted >= 0 ? options[highlighted] : undefined;
                        add(option ? option.label : text);
                    }}
                    onKeyPress={(event) => {
                        const key = event.nativeEvent.key;
                        if (key === 'Backspace' && !text && tags.length) {
                            if (selected === tags.length - 1) remove(selected);
                            else {
                                setSelected(tags.length - 1);
                                announce(t.tagSelected(tags.at(-1)!));
                            }
                        }
                        if (Platform.OS !== 'web' || !showList || !options.length) return;
                        if (key === 'ArrowDown') setHighlighted((highlighted + 1) % options.length);
                        if (key === 'ArrowUp') setHighlighted(highlighted <= 0 ? options.length - 1 : highlighted - 1);
                        if (key === 'Escape') setHighlighted(-1);
                    }}
                    onFocus={onFocus}
                    onBlur={onBlur}
                />
            </View>
            {showList && (
                <InlineOptions
                    id={listId}
                    label={translations.select.suggestions}
                    options={options}
                    highlighted={highlighted}
                    onSelect={(option) => {
                        add(option.label);
                        field.current?.focus();
                    }}
                    loading={list.loading}
                    loadingText={loadingText}
                    hasMore={list.hasMore}
                    onLoadMore={list.loadMore}
                />
            )}
            {region}
        </View>
    );
}
