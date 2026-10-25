import { useFieldContext } from '@ark-ui/react/field';
import {
    insertMention,
    mentionQuery,
    mentionSegments,
    mentions as mentionsRecipe,
    parseMentionMarkup,
    toMentionMarkup,
    updateMentions,
    type DataSource,
    type ItemAccessor,
    type ListOption,
    type Mention,
    type MentionQuery,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { LoaderCircle } from 'lucide-react';
import {
    useId,
    useLayoutEffect,
    useRef,
    useState,
    type ComponentProps,
    type KeyboardEvent,
    type ReactNode,
    type SyntheticEvent,
} from 'react';
import { useOptionSource } from '../../utils/data-source.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';
import { useListOptions } from '../Select/list.js';

/** A character that opens suggestions, with its own entries (e.g. "@" people, "#" topics) */
export interface MentionTrigger<T = unknown> {
    char: string;
    items?: readonly T[];
    /** Loads the entries for the typed text instead of `items` */
    dataSource?: DataSource<T>;
}

export interface MentionsProps<T = unknown> extends Omit<
    ComponentProps<'textarea'>,
    'value' | 'defaultValue' | 'onChange' | 'children'
> {
    /** Text with markup: "Hello @[Anna Berg](anna)" (controlled) */
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    /** The mentions in the text after every change */
    onMentionsChange?: (mentions: Mention[]) => void;
    /** Text typed after a trigger (e.g. to load entries yourself) */
    onSearch?: (trigger: string, query: string) => void;
    /** Entries are being loaded (after onSearch): the list shows "Loading" */
    loading?: boolean;
    /** Entries for "@" (shorthand for one trigger) */
    items?: readonly T[];
    /** Loads the "@" entries for the typed text */
    dataSource?: DataSource<T>;
    /** Several trigger characters with their own entries (replaces items/dataSource) */
    triggers?: readonly MentionTrigger<T>[];
    /** Text of an entry: property name or function (default `label`) */
    itemLabel?: ItemAccessor<T, string>;
    /** Id of an entry in the markup: property name or function (default `value`, else `id`) */
    itemValue?: ItemAccessor<T, unknown>;
    /** Most suggestions shown (default 8) */
    limit?: number;
    invalid?: boolean;
    /** Content of a suggestion (instead of its text) */
    renderItem?: (item: T, state: { highlighted: boolean }) => ReactNode;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof mentionsRecipe>;
}

const caretKeys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
const defaultValueOf = (item: unknown) =>
    typeof item === 'object' && item !== null
        ? ((item as Record<string, unknown>).value ?? (item as Record<string, unknown>).id)
        : item;

/**
 * Text field with mentions: "@" (or another trigger) opens suggestions below the field – arrow keys choose, Enter or
 * Tab takes one, Escape closes them. Mentions are marked behind the text; the value keeps their ids.
 */
export function Mentions<T = unknown>({
    classes,
    value,
    defaultValue = '',
    onValueChange,
    onMentionsChange,
    onSearch,
    loading = false,
    items,
    dataSource,
    triggers,
    itemLabel,
    itemValue,
    limit = 8,
    placeholder,
    rows = 3,
    disabled,
    readOnly,
    invalid,
    required,
    name,
    renderItem,
    className,
    style,
    onKeyDown,
    onBlur,
    ...props
}: MentionsProps<T>) {
    const mentionsStyles = useRecipe('mentions', mentionsRecipe, classes);
    const styles = mentionsStyles();
    const field = useFieldContext();
    const t = useTranslations();
    const id = useId();
    const listId = `${id}list`;
    const hintId = `${id}hint`;
    const textarea = useRef<HTMLTextAreaElement>(null);
    const highlighter = useRef<HTMLDivElement>(null);
    const pendingCaret = useRef<number | null>(null);

    const triggerList: readonly MentionTrigger<T>[] = triggers ?? [{ char: '@', items, dataSource }];
    const chars = triggerList.map((trigger) => trigger.char);
    const [internal, setInternal] = useState(defaultValue);
    const markup = value ?? internal;
    const parsed = parseMentionMarkup(markup, chars);
    const [query, setQuery] = useState<MentionQuery | null>(null);
    const active = triggerList.find((trigger) => trigger.char === query?.trigger);
    const accessors = { itemLabel, itemValue: itemValue ?? (defaultValueOf as ItemAccessor<T, unknown>) };
    const source = useOptionSource<T>({ items: active?.items ?? [], source: active?.dataSource, accessors });
    const { visible } = useListOptions(source.items, accessors, active?.dataSource ? '' : (query?.query ?? ''));
    const options = visible.filter((option) => !option.disabled).slice(0, limit);
    const [highlightedIndex, setHighlighted] = useState(0);
    const highlighted = highlightedIndex < options.length ? highlightedIndex : 0;
    const busy = loading || source.loading;
    const open = !!query && !!active && (options.length > 0 || busy);
    const isDisabled = disabled ?? field?.disabled;
    const isReadOnly = readOnly ?? field?.readOnly;
    const isInvalid = invalid ?? field?.invalid;
    // A last empty line keeps its height in the layer behind the text
    const segments: { text: string; mention?: Mention }[] = [
        ...mentionSegments(parsed.text, parsed.mentions),
        ...(parsed.text.endsWith('\n') ? [{ text: ' ' }] : []),
    ];
    const optionId = (index: number) => `${id}option${index}`;

    // The caret after inserting a mention, once the new text is rendered
    useLayoutEffect(() => {
        const caret = pendingCaret.current;
        if (caret === null || !textarea.current) return;
        pendingCaret.current = null;
        textarea.current.focus();
        textarea.current.setSelectionRange(caret, caret);
    });

    const commit = (text: string, mentions: Mention[]) => {
        const next = toMentionMarkup(text, mentions);
        if (next === markup) return;
        setInternal(next);
        onValueChange?.(next);
        onMentionsChange?.(mentions);
    };
    const updateQuery = (element: HTMLTextAreaElement, mentions: readonly Mention[] = parsed.mentions) => {
        const next =
            element.selectionStart === element.selectionEnd
                ? mentionQuery(element.value, element.selectionStart, chars, mentions)
                : null;
        const changed = next?.trigger !== query?.trigger || next?.query !== query?.query;
        setQuery(next);
        if (!next || !changed) return;
        setHighlighted(0);
        onSearch?.(next.trigger, next.query);
        if (triggerList.find((trigger) => trigger.char === next.trigger)?.dataSource) source.search(next.query);
    };
    const pick = (option: ListOption<T>) => {
        const element = textarea.current;
        if (!element || !query) return;
        const result = insertMention(parsed, query, element.selectionStart, { id: option.key, label: option.label });
        setQuery(null);
        pendingCaret.current = result.caret;
        commit(result.text, result.mentions);
    };
    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        onKeyDown?.(event);
        if (!open || event.defaultPrevented) return;
        const count = options.length;
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            if (count) setHighlighted((highlighted + (event.key === 'ArrowDown' ? 1 : count - 1)) % count);
        } else if ((event.key === 'Enter' || event.key === 'Tab') && count && !event.shiftKey) {
            event.preventDefault();
            pick(options[highlighted]!);
        } else if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            setQuery(null);
        }
    };
    const onCaretMove = (event: SyntheticEvent<HTMLTextAreaElement>) => updateQuery(event.currentTarget);

    return (
        <div className={styles.base({ class: className })} style={style}>
            <div
                className={styles.control()}
                data-invalid={isInvalid || undefined}
                data-disabled={isDisabled || undefined}
            >
                <div ref={highlighter} className={styles.highlighter()} aria-hidden="true">
                    {segments.map((segment, index) =>
                        segment.mention ? (
                            <mark key={index} className={styles.mark()}>
                                {segment.text}
                            </mark>
                        ) : (
                            <span key={index}>{segment.text}</span>
                        )
                    )}
                </div>
                <textarea
                    {...props}
                    id={field?.ids.control ?? props.id}
                    ref={textarea}
                    className={styles.textarea()}
                    value={parsed.text}
                    rows={rows}
                    placeholder={placeholder}
                    disabled={isDisabled}
                    readOnly={isReadOnly}
                    required={(required ?? field?.required) || undefined}
                    aria-invalid={isInvalid || undefined}
                    aria-autocomplete="list"
                    aria-controls={open ? listId : undefined}
                    aria-activedescendant={open && options.length ? optionId(highlighted) : undefined}
                    aria-describedby={[field?.ariaDescribedby, hintId].filter(Boolean).join(' ')}
                    onChange={(event) => {
                        const element = event.currentTarget;
                        const mentions = updateMentions(parsed.text, element.value, parsed.mentions);
                        commit(element.value, mentions);
                        updateQuery(element, mentions);
                    }}
                    onKeyDown={handleKeyDown}
                    onClick={onCaretMove}
                    onKeyUp={(event) => {
                        if (caretKeys.includes(event.key)) onCaretMove(event);
                    }}
                    onBlur={(event) => {
                        setQuery(null);
                        onBlur?.(event);
                    }}
                    onScroll={(event) => {
                        if (highlighter.current) highlighter.current.scrollTop = event.currentTarget.scrollTop;
                    }}
                />
            </div>
            {open && (
                <ul id={listId} role="listbox" aria-label={t.mentions.suggestions} className={styles.content()}>
                    {options.map((option, index) => (
                        <li
                            key={option.key}
                            id={optionId(index)}
                            role="option"
                            aria-selected={index === highlighted}
                            data-highlighted={index === highlighted || undefined}
                            className={styles.option()}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => pick(option)}
                            onPointerMove={() => setHighlighted(index)}
                        >
                            {renderItem ? (
                                renderItem(option.item, { highlighted: index === highlighted })
                            ) : (
                                <span className={styles.optionBody()}>
                                    {option.label}
                                    {option.description && (
                                        <span className={styles.optionDescription()}>{option.description}</span>
                                    )}
                                </span>
                            )}
                        </li>
                    ))}
                    {busy && (
                        <li role="presentation" className={styles.loading()}>
                            <LoaderCircle className={styles.loadingIcon()} aria-hidden="true" />
                            {t.common.loading}
                        </li>
                    )}
                </ul>
            )}
            <span id={hintId} className={styles.status()}>
                {t.mentions.hint(chars.join(' '))}
            </span>
            <span role="status" className={styles.status()}>
                {open ? t.mentions.count(options.length) : ''}
            </span>
            {name && <input type="hidden" name={name} value={markup} />}
        </div>
    );
}
