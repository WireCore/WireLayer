import {
    insertMention,
    mentionQuery,
    mentions as mentionsRecipe,
    parseMentionMarkup,
    toMentionMarkup,
    toListOptions,
    updateMentions,
    type DataSource,
    type ItemAccessor,
    type Mention,
} from '@wirecore/wirelayer-recipes/native';
import { useEffect, useId, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { Platform, TextInput, View } from 'react-native';
import { useTranslations } from '../../locale.js';
import { useAnnouncer } from '../../utils/announce.js';
import { useOptionSource } from '../../utils/data-source.js';
import { InlineOptions, inlineOptionId } from '../../utils/InlineOptions.js';
import { contains } from '../../utils/options.js';
import { useControllable } from '../../utils/useControllable.js';
import { useFocusWithin } from '../../utils/useFocusWithin.js';
import { useFieldControl } from '../Field/Field.js';
import { Textarea } from '../Textarea/Textarea.js';

export interface MentionsProps<T = { value: string; label: string }> {
    /** Text with markup: "Hello @[Anna Berg](anna)" */
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    /** The mentions in the text after every change */
    onMentionsChange?: (mentions: Mention[]) => void;
    /** Text typed after the trigger (e.g. to load entries yourself) */
    onSearch?: (trigger: string, query: string) => void;
    /** Entries are being loaded (after onSearch): the list shows "Loading" */
    loading?: boolean;
    /** Entries for the trigger */
    items?: readonly T[];
    /** Loads the entries for the typed text */
    dataSource?: DataSource<T>;
    /** Character that opens the suggestions (default "@") */
    trigger?: string;
    /** Text of an entry: property name or function (default `label`) */
    itemLabel?: ItemAccessor<T, string>;
    /** Id of an entry in the markup: property name or function (default `value`, else `id`) */
    itemValue?: ItemAccessor<T, unknown>;
    /** Most suggestions shown (default 8) */
    limit?: number;
    /** Content of a suggestion (instead of its text) */
    renderItem?: (item: T, state: { selected: boolean; disabled: boolean }) => ReactNode;
    placeholder?: string;
    invalid?: boolean;
    disabled?: boolean;
    /** Accessible name without a surrounding Field (default "Message") */
    'aria-label'?: string;
    className?: string;
}

/**
 * Text field with mentions: the trigger ("@") opens suggestions below the field, a tap inserts the entry. The value
 * keeps the mentions as markup ("@[Anna Berg](anna)"), the field shows the plain text.
 */
export function Mentions<T = { value: string; label: string }>({
    value,
    defaultValue = '',
    onValueChange,
    onMentionsChange,
    onSearch,
    loading = false,
    items = [],
    dataSource,
    trigger = '@',
    itemLabel,
    itemValue,
    limit = 8,
    renderItem,
    placeholder,
    invalid,
    disabled,
    'aria-label': ariaLabel,
    className,
}: MentionsProps<T>) {
    const translations = useTranslations();
    const t = translations.mentions;
    const control = useFieldControl({ invalid, disabled });
    const [markup, setMarkup] = useControllable(value, defaultValue, onValueChange);
    const parsed = parseMentionMarkup(markup, [trigger]);
    const [caret, setCaret] = useState(parsed.text.length);
    // Set only after inserting a mention (caret after it) – otherwise the field keeps its own selection
    const [selection, setSelection] = useState<{ start: number; end: number } | undefined>(undefined);
    const [highlighted, setHighlighted] = useState(0);
    const { focused, onFocus, onBlur } = useFocusWithin();
    const listId = `${useId()}suggestions`;
    const field = useRef<ComponentRef<typeof TextInput>>(null);
    const { announce, region } = useAnnouncer();
    const query = focused ? mentionQuery(parsed.text, caret, [trigger], parsed.mentions) : null;
    const accessors = {
        itemLabel,
        itemValue:
            itemValue ??
            ((item: T) => (item as { value?: unknown; id?: unknown }).value ?? (item as { id?: unknown }).id),
    };
    const source = useOptionSource<T>({ items, source: dataSource, accessors, minSearchLength: 0 });
    const queryText = query?.query;
    const { active, search } = source;
    useEffect(() => {
        if (queryText === undefined) return;
        onSearch?.(trigger, queryText);
        if (active) search(queryText);
        // Only when the typed text changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [queryText]);
    const options = toListOptions(source.items, accessors)
        .filter((option) => source.active || !query || contains(option.label, query.query))
        .slice(0, limit);
    const open = !!query && (options.length > 0 || loading || source.loading);
    useEffect(() => {
        if (open) announce(t.count(options.length));
        // Announce when the number of suggestions changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, options.length]);

    const emit = (text: string, mentions: Mention[]) => {
        setMarkup(toMentionMarkup(text, mentions));
        onMentionsChange?.(mentions);
    };
    const pick = (index: number) => {
        const option = options[index];
        if (!option || !query) return;
        const next = insertMention(parsed, query, caret, { id: String(option.value), label: option.label });
        emit(next.text, next.mentions);
        setCaret(next.caret);
        setSelection({ start: next.caret, end: next.caret });
        setHighlighted(0);
        field.current?.focus();
    };

    return (
        <View className={mentionsRecipe().base({ class: className })}>
            <Textarea
                ref={field}
                value={parsed.text}
                placeholder={placeholder}
                invalid={invalid}
                disabled={disabled}
                aria-label={control.label ?? ariaLabel ?? t.label}
                accessibilityHint={[control.description, t.hint(trigger)].filter(Boolean).join('. ')}
                // A textarea cannot be a combobox – the suggestions are linked with aria-controls
                {...({
                    'aria-controls': open ? listId : undefined,
                    'aria-activedescendant': open ? inlineOptionId(listId, highlighted) : undefined,
                } as object)}
                selection={selection}
                onSelectionChange={(event) => {
                    setCaret(event.nativeEvent.selection.start);
                    setSelection(undefined);
                }}
                onChangeText={(text) => {
                    emit(text, updateMentions(parsed.text, text, parsed.mentions));
                    setHighlighted(0);
                }}
                onKeyPress={(event) => {
                    if (Platform.OS !== 'web' || !open || !options.length) return;
                    const key = event.nativeEvent.key;
                    if (key === 'ArrowDown') setHighlighted((highlighted + 1) % options.length);
                    if (key === 'ArrowUp') setHighlighted(highlighted <= 0 ? options.length - 1 : highlighted - 1);
                    if (key === 'Enter' || key === 'Tab') {
                        (event as unknown as { preventDefault(): void }).preventDefault();
                        pick(highlighted);
                    }
                }}
                onFocus={onFocus}
                onBlur={onBlur}
            />
            {open && (
                <InlineOptions
                    id={listId}
                    label={t.suggestions}
                    options={options}
                    highlighted={highlighted}
                    onSelect={(option) => pick(options.indexOf(option))}
                    renderItem={renderItem}
                    loading={loading || source.loading}
                />
            )}
            {region}
        </View>
    );
}
