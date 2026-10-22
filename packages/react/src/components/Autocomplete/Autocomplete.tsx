import { Combobox as ArkCombobox } from '@ark-ui/react/combobox';
import { createListCollection } from '@ark-ui/react/collection';
import { Portal } from '@ark-ui/react/portal';
import {
    combobox as comboboxRecipe,
    type DataSource,
    type ItemAccessor,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { LoaderCircle, X } from 'lucide-react';
import { useMemo, useState, type ComponentProps, type ReactNode } from 'react';
import { useOptionSource } from '../../utils/data-source.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';
import { ListOptions, useListOptions, type ListItemState, type SelectSize } from '../Select/list.js';
import { TagsInput } from '../TagsInput/TagsInput.js';

export interface AutocompleteProps<T = string> extends Omit<
    ComponentProps<'input'>,
    'value' | 'defaultValue' | 'size'
> {
    /** Suggestions while typing – any other text is allowed, too; strings or objects (read with itemLabel) */
    items: readonly T[];
    /** The text */
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    /** Several entries as chips (a TagsInput with these suggestions) – use values/onValuesChange */
    multiple?: boolean;
    /** The entries with `multiple` */
    values?: string[];
    defaultValues?: string[];
    onValuesChange?: (values: string[]) => void;
    /** Most entries with `multiple` */
    max?: number;
    /** Filters the suggestions by the typed text (ignores case and accents) */
    filter?: boolean;
    /** The suggestions are filtered elsewhere (server): no local filtering, listen to onFilterChange */
    manualFilter?: boolean;
    /** Typed text – e.g. to load matching suggestions from a server (manualFilter) */
    onFilterChange?: (text: string) => void;
    /** Text of a suggestion: property name or function (default: `label`, or the item itself) */
    itemLabel?: ItemAccessor<T, string>;
    /** Disabled state of a suggestion: property name or function (default: `disabled`) */
    itemDisabled?: ItemAccessor<T, boolean>;
    /** Group heading of a suggestion: property name or function (default: `group`) */
    itemGroup?: ItemAccessor<T, string | null | undefined>;
    /** Button that clears the text (not a tab stop – the text can be deleted, too) */
    clearable?: boolean;
    /** Shows a spinner in the field and "Loading" in the list (aria-busy) */
    loading?: boolean;
    /** Text of the loading row in the list */
    loadingText?: string;
    /** Height of the field: 32, 40 (default) or 48 px */
    size?: SelectSize;
    /** More suggestions can be loaded: scrolling to the end of the list calls onLoadMore */
    hasMore?: boolean;
    /** The end of the list was scrolled into view (hasMore) */
    onLoadMore?: () => void;
    /** Loads the suggestions for the typed text (after a typing pause, outdated answers dropped) */
    dataSource?: DataSource<T>;
    /** Fewest characters typed before the data source is asked */
    minSearchLength?: number;
    /** Suggestions per request of the data source (default 50) */
    pageSize?: number;
    /** Content of a suggestion (instead of its text) */
    renderItem?: (item: T, state: ListItemState) => ReactNode;
    invalid?: boolean;
    required?: boolean;
    name?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof comboboxRecipe>;
}

/** Free text with suggestions: type, arrow keys to pick a suggestion, Enter takes it, Escape closes the list */
export function Autocomplete<T = string>({
    classes,
    items,
    value,
    defaultValue = '',
    onValueChange,
    multiple,
    values,
    defaultValues,
    onValuesChange,
    max,
    filter = true,
    manualFilter,
    onFilterChange,
    itemLabel,
    itemDisabled,
    itemGroup,
    clearable,
    loading,
    loadingText,
    size,
    hasMore,
    onLoadMore,
    dataSource,
    minSearchLength,
    pageSize,
    renderItem,
    placeholder,
    disabled,
    readOnly,
    invalid,
    required,
    name,
    className,
    style,
    ...props
}: AutocompleteProps<T>) {
    const combobox = useRecipe('combobox', comboboxRecipe, classes);
    const styles = combobox({ size });
    const translations = useTranslations();
    const [internal, setInternal] = useState(defaultValue);
    const text = value ?? internal;
    // The list only opens while there are suggestions – an empty popup would hide nothing useful
    const [open, setOpen] = useState(false);
    // A suggestion's value is its text
    const labelOf = (item: T): string => {
        if (typeof itemLabel === 'function') return itemLabel(item);
        if (typeof item === 'object' && item !== null)
            return String((item as Record<string, unknown>)[itemLabel ?? 'label'] ?? '');
        return String(item);
    };
    const accessors = { itemValue: labelOf, itemLabel: labelOf, itemDisabled, itemGroup };
    const source = useOptionSource<T>({ items, source: dataSource, accessors, pageSize, minSearchLength });
    const { options, visible, groups, ordered } = useListOptions(
        source.items,
        accessors,
        filter && !manualFilter && !dataSource ? text : ''
    );
    const listLoading = loading || source.loading;
    const listHasMore = hasMore || source.hasMore;
    const loadMore = () => (dataSource ? source.loadMore() : onLoadMore?.());
    const onFilter = (next: string) => {
        onFilterChange?.(next);
        if (dataSource) source.search(next);
    };
    const collection = useMemo(
        () =>
            createListCollection({
                items: ordered,
                itemToString: (item) => item.label,
                itemToValue: (item) => item.key,
                isItemDisabled: (item) => item.disabled,
            }),
        [ordered]
    );
    const setText = (next: string) => {
        setInternal(next);
        onValueChange?.(next);
    };

    if (multiple) {
        // Several entries: chips with suggestions (see TagsInput)
        return (
            <TagsInput
                value={values}
                defaultValue={defaultValues}
                onValueChange={onValuesChange}
                suggestions={options.filter((option) => !option.disabled).map((option) => option.label)}
                filter={filter}
                manualFilter={manualFilter}
                onFilterChange={onFilter}
                loading={listLoading}
                loadingText={loadingText}
                hasMore={listHasMore}
                onLoadMore={loadMore}
                max={max}
                placeholder={placeholder}
                disabled={disabled}
                invalid={invalid}
                name={name}
                aria-label={props['aria-label']}
                className={className}
                style={style}
            />
        );
    }

    return (
        <ArkCombobox.Root
            className={styles.base({ class: className })}
            style={style}
            collection={collection}
            inputValue={text}
            onInputValueChange={(details) => {
                if (details.inputValue === text) return;
                setText(details.inputValue);
                if (details.reason === 'input-change') onFilter(details.inputValue);
            }}
            open={open && (visible.length > 0 || !!listLoading)}
            onOpenChange={(details) => setOpen(details.open)}
            allowCustomValue
            disabled={disabled}
            readOnly={readOnly}
            invalid={invalid}
            required={required}
            name={name}
            placeholder={placeholder}
            positioning={{ sameWidth: true, gutter: 4 }}
            translations={translations.combobox}
            lazyMount
            unmountOnExit
        >
            <ArkCombobox.Control className={styles.control()}>
                <ArkCombobox.Input {...props} className={styles.input()} aria-busy={loading || undefined} />
                {clearable && (
                    <ArkCombobox.Context>
                        {(api) =>
                            text &&
                            !api.disabled &&
                            !readOnly && (
                                // Not a tab stop: the text can be deleted with the keyboard
                                <button
                                    type="button"
                                    tabIndex={-1}
                                    className={styles.clear()}
                                    aria-label={translations.combobox.clearTriggerLabel}
                                    onClick={() => {
                                        setText('');
                                        api.focus();
                                    }}
                                >
                                    <X className={styles.clearIcon()} aria-hidden="true" />
                                </button>
                            )
                        }
                    </ArkCombobox.Context>
                )}
                {loading && (
                    <span className={styles.status()}>
                        <LoaderCircle className={styles.spinner()} aria-hidden="true" />
                    </span>
                )}
            </ArkCombobox.Control>
            <Portal>
                <ArkCombobox.Positioner>
                    <ArkCombobox.Content className={styles.content()} aria-busy={listLoading || undefined}>
                        <ListOptions
                            parts={ArkCombobox}
                            groups={groups}
                            classes={{
                                item: styles.item(),
                                itemText: styles.itemText(),
                                icon: styles.itemIndicator(),
                                itemIndicator: styles.itemIndicator(),
                                itemBody: styles.itemBody(),
                                itemDescription: styles.itemDescription(),
                                group: styles.group(),
                                groupLabel: styles.groupLabel(),
                                loading: styles.loading(),
                                loadingIcon: styles.loadingIcon(),
                                sentinel: styles.sentinel(),
                            }}
                            noIndicator
                            loading={listLoading}
                            loadingText={loadingText ?? translations.common.loading}
                            hasMore={listHasMore}
                            onLoadMore={loadMore}
                            renderItem={renderItem}
                        />
                    </ArkCombobox.Content>
                </ArkCombobox.Positioner>
            </Portal>
            {dataSource && (
                <span role="status" className={styles.announcer()}>
                    {source.announcement}
                </span>
            )}
        </ArkCombobox.Root>
    );
}
