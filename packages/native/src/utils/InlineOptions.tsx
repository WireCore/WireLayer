import { select, type ListOption } from '@wirecore/wirelayer-recipes/native';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useLocale } from '../locale.js';
import { Loader } from './Loader.js';
import { Icon, type IconComponent } from './Icon.js';

export interface InlineOptionsProps<T> {
    /** nativeID of the list – the field points at it (aria-controls) */
    id: string;
    /** Accessible name of the list */
    label: string;
    options: readonly ListOption<T>[];
    /** Highlighted option (arrow keys on the web), -1 for none */
    highlighted: number;
    onSelect: (option: ListOption<T>) => void;
    renderItem?: (item: T, state: { selected: boolean; disabled: boolean }) => ReactNode;
    loading?: boolean;
    loadingText?: string;
    hasMore?: boolean;
    onLoadMore?: () => void;
    /** Shown when there are no options (undefined: nothing) */
    emptyText?: string;
}

/** Id of an inline option for aria-activedescendant */
export const inlineOptionId = (listId: string, index: number) => `${listId}-option-${index}`;

/**
 * Suggestions below a text field (Autocomplete, TagsInput, Mentions): a listbox in the page flow – no overlay to
 * position – with 48 pt rows; "Load more" pages on.
 */
export function InlineOptions<T>({
    id,
    label,
    options,
    highlighted,
    onSelect,
    renderItem,
    loading = false,
    loadingText,
    hasMore = false,
    onLoadMore,
    emptyText,
}: InlineOptionsProps<T>) {
    const { translations } = useLocale();
    const styles = select();
    if (!options.length && !loading && emptyText === undefined) return null;
    return (
        <View className={styles.inlineList()}>
            <View
                nativeID={id}
                // "listbox" is not a React Native role – the web gets it, iOS/Android read the options as a list
                {...({ role: 'listbox' } as object)}
                aria-label={label}
                aria-busy={loading || undefined}
            >
                {options.map((option, index) => (
                    <Pressable
                        key={option.key}
                        nativeID={inlineOptionId(id, index)}
                        role="option"
                        aria-selected={index === highlighted}
                        disabled={option.disabled}
                        aria-disabled={option.disabled || undefined}
                        className={select({ highlighted: index === highlighted }).option()}
                        onPress={() => onSelect(option)}
                    >
                        {renderItem ? (
                            renderItem(option.item, { selected: index === highlighted, disabled: option.disabled })
                        ) : (
                            <>
                                {!!option.icon && (
                                    <Icon icon={option.icon as IconComponent} className={styles.icon()} />
                                )}
                                <Text className={styles.optionText()}>{option.label}</Text>
                            </>
                        )}
                    </Pressable>
                ))}
            </View>
            {loading ? (
                <View className={styles.status()} role="status" aria-live="polite">
                    <Loader className={styles.spinner()} />
                    <Text className={styles.statusText()}>{loadingText ?? translations.common.loading}</Text>
                </View>
            ) : hasMore ? (
                <Pressable role="button" className={styles.option()} onPress={onLoadMore}>
                    <Text className={styles.optionText()}>{translations.dataSource.loadMore}</Text>
                </Pressable>
            ) : (
                !options.length && (
                    <Text role="status" className={styles.statusText({ class: styles.status() })}>
                        {emptyText}
                    </Text>
                )
            )}
        </View>
    );
}
