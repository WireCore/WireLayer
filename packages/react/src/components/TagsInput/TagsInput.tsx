import { useFieldContext } from '@ark-ui/react/field';
import { useFilter } from '@ark-ui/react/locale';
import { TagsInput as ArkTagsInput } from '@ark-ui/react/tags-input';
import { tagsInput as tagsInputRecipe, type DataSource, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { LoaderCircle, X } from 'lucide-react';
import { useId, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';
import { LoadMore } from '../Select/list.js';
import { useDataSource } from '../../utils/data-source.js';

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
    name?: string;
    /** Suggestions while typing (entries already added are left out); arrow keys pick one, Enter adds it */
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
    /** More suggestions can be loaded: scrolling to the end of the list calls onLoadMore */
    hasMore?: boolean;
    /** The end of the suggestions was scrolled into view (hasMore) */
    onLoadMore?: () => void;
    /**
     * Suggestions from a server instead of `suggestions`: asked with the typed text after a typing pause (outdated
     * answers dropped), more while scrolling
     */
    dataSource?: DataSource<string>;
    /** Fewest characters the typed text needs before the data source is asked (default 1) */
    minSearchLength?: number;
    /** Accessible name without a surrounding Field */
    'aria-label'?: string;
    /** Id of the input, e.g. for a `<label for>` */
    id?: string;
    className?: string;
    style?: CSSProperties;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof tagsInputRecipe>;
}

interface Api {
    value: string[];
    atMax: boolean;
    addValue(value: string): void;
    clearInputValue(): void;
}

/**
 * Free entries: Enter or "," adds, Backspace on the empty field selects the last entry (again removes it),
 * arrow keys move between entries; additions and removals are announced. With suggestions the field is a
 * combobox: Arrow down opens them, Enter adds the highlighted one.
 */
export function TagsInput({
    classes,
    value,
    defaultValue,
    onValueChange,
    placeholder,
    max,
    delimiter = ',',
    validate,
    disabled,
    invalid,
    name,
    suggestions,
    filter = true,
    manualFilter,
    onFilterChange,
    loading: loadingProp,
    loadingText,
    hasMore: hasMoreProp,
    onLoadMore,
    dataSource,
    minSearchLength = 1,
    'aria-label': ariaLabel,
    id,
    className,
    style,
}: TagsInputProps) {
    const tagsInput = useRecipe('tagsInput', tagsInputRecipe, classes);
    const styles = tagsInput();
    const translations = useTranslations();
    // The input gets the Field's control id, so the Field label names it – or an own id (Ark finds the input by it)
    const field = useFieldContext();
    // Suggestions: a listbox below the field; the input is its combobox (Ark leaves Enter to it while an option is
    // highlighted)
    const listId = useId();
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    // Suggestions from a server: the typed text is the search, more pages while scrolling
    const source = useDataSource<string>({ source: dataSource, minSearchLength });
    const suggestionList = dataSource ? source.state.items : suggestions;
    const loading = !!loadingProp || (source.active && source.state.status === 'loading');
    const hasMore = dataSource ? source.state.hasMore : hasMoreProp;
    const loadMore = dataSource ? source.loadMore : onLoadMore;
    const [highlighted, setHighlighted] = useState(-1);
    // Accent-blind ("nu" finds "Nürnberg"), like Combobox
    const { contains } = useFilter({ sensitivity: 'base', usage: 'sort' });
    const suggestionsFor = (taken: string[]) => {
        const added = new Set(taken.map((entry) => entry.toLocaleLowerCase()));
        const text = query.trim();
        return (suggestionList ?? []).filter(
            (suggestion) =>
                !added.has(suggestion.toLocaleLowerCase()) &&
                (!filter || manualFilter || !!dataSource || !text || contains(suggestion, text))
        );
    };
    const isOpen = (list: string[], atMax: boolean) => open && !atMax && (list.length > 0 || !!loading);
    const optionId = (index: number) => `${listId}-${index}`;

    function add(api: Api, suggestion: string) {
        api.addValue(suggestion);
        api.clearInputValue();
        setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent<HTMLInputElement>, api: Api) {
        const list = suggestionsFor(api.value);
        const shown = isOpen(list, api.atMax);
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            if (!shown) {
                setOpen(true);
                setHighlighted(event.key === 'ArrowDown' ? 0 : list.length - 1);
                return;
            }
            const step = event.key === 'ArrowDown' ? 1 : -1;
            setHighlighted((highlighted + step + list.length) % list.length);
        } else if (event.key === 'Enter' && shown && list[highlighted] !== undefined) {
            event.preventDefault();
            add(api, list[highlighted]!);
        } else if (event.key === 'Escape' && shown) {
            setOpen(false);
        }
    }

    return (
        <ArkTagsInput.Root
            className={styles.base({ class: className })}
            style={style}
            value={value}
            defaultValue={defaultValue}
            onValueChange={(details) => onValueChange?.(details.value)}
            onInputValueChange={(details) => {
                if (details.inputValue === query) return;
                setQuery(details.inputValue);
                setHighlighted(-1);
                setOpen(!!details.inputValue);
                onFilterChange?.(details.inputValue);
                if (dataSource && details.inputValue) source.search(details.inputValue);
            }}
            max={max}
            delimiter={delimiter}
            validate={validate && ((details) => validate(details.inputValue))}
            disabled={disabled}
            invalid={invalid}
            name={name}
            ids={id || field ? { input: id ?? field?.ids.control } : undefined}
            addOnPaste
            translations={translations.tagsInput}
        >
            <ArkTagsInput.Context>
                {(api) => {
                    const list = suggestionsFor(api.value);
                    const shown = !!suggestionList && isOpen(list, api.atMax);
                    return (
                        <>
                            <ArkTagsInput.Control className={styles.control()}>
                                {api.value.map((entry, index) => (
                                    <ArkTagsInput.Item
                                        key={index}
                                        index={index}
                                        value={entry}
                                        className={styles.item()}
                                    >
                                        <ArkTagsInput.ItemPreview className={styles.preview()}>
                                            <ArkTagsInput.ItemText>{entry}</ArkTagsInput.ItemText>
                                            <ArkTagsInput.ItemDeleteTrigger className={styles.delete()}>
                                                <X className={styles.deleteIcon()} aria-hidden="true" />
                                            </ArkTagsInput.ItemDeleteTrigger>
                                        </ArkTagsInput.ItemPreview>
                                        <ArkTagsInput.ItemInput className={styles.itemInput()} />
                                    </ArkTagsInput.Item>
                                ))}
                                {suggestionList ? (
                                    <ArkTagsInput.Input
                                        className={styles.input()}
                                        placeholder={placeholder}
                                        aria-label={field ? undefined : ariaLabel}
                                        aria-describedby={field?.ariaDescribedby}
                                        role="combobox"
                                        aria-autocomplete="list"
                                        aria-expanded={shown}
                                        aria-controls={listId}
                                        aria-busy={loading || undefined}
                                        aria-activedescendant={
                                            shown && highlighted >= 0 ? optionId(highlighted) : undefined
                                        }
                                        onKeyDown={(event) => onKeyDown(event, api)}
                                        onBlur={() => setOpen(false)}
                                    />
                                ) : (
                                    <ArkTagsInput.Input
                                        className={styles.input()}
                                        placeholder={placeholder}
                                        aria-label={field ? undefined : ariaLabel}
                                        aria-describedby={field?.ariaDescribedby}
                                    />
                                )}
                                {api.value.length > 0 && (
                                    <ArkTagsInput.ClearTrigger className={styles.clear()}>
                                        <X className={styles.clearIcon()} aria-hidden="true" />
                                    </ArkTagsInput.ClearTrigger>
                                )}
                            </ArkTagsInput.Control>
                            {shown && (
                                <div
                                    id={listId}
                                    role="listbox"
                                    aria-label={translations.select.suggestions}
                                    aria-busy={loading || undefined}
                                    data-state="open"
                                    data-side="bottom"
                                    className={styles.content()}
                                >
                                    {list.map((suggestion, index) => (
                                        // Pointer down keeps the focus in the field
                                        <div
                                            key={suggestion}
                                            id={optionId(index)}
                                            role="option"
                                            aria-selected={index === highlighted}
                                            data-highlighted={index === highlighted ? '' : undefined}
                                            className={styles.option()}
                                            onPointerDown={(event) => event.preventDefault()}
                                            onPointerMove={() => setHighlighted(index)}
                                            onClick={() => add(api, suggestion)}
                                        >
                                            <span className={styles.optionText()}>{suggestion}</span>
                                        </div>
                                    ))}
                                    {loading && (
                                        <div className={styles.loading()}>
                                            <LoaderCircle className={styles.loadingIcon()} aria-hidden="true" />
                                            {loadingText ?? translations.common.loading}
                                        </div>
                                    )}
                                    {hasMore && (
                                        <LoadMore
                                            className={styles.sentinel()}
                                            active={!loading}
                                            count={list.length}
                                            onLoad={() => loadMore?.()}
                                        />
                                    )}
                                </div>
                            )}
                        </>
                    );
                }}
            </ArkTagsInput.Context>
            <ArkTagsInput.HiddenInput />
        </ArkTagsInput.Root>
    );
}
