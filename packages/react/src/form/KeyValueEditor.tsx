import { useStore, type AnyFieldApi } from '@tanstack/react-form';
import { keyValueEditor as keyValueEditorRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { useId } from 'react';
import { Input } from '../components/Input/Input.js';
import { useTranslations } from '../components/LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../components/RecipesProvider/RecipesProvider.js';
import { FormList } from './FormList.js';

/** One row of a KeyValueEditor */
export interface KeyValuePair {
    key: string;
    value: string;
}

export interface KeyValueEditorProps {
    /** The TanStack Form field of the array of { key, value } (`mode="array"`) */
    field: AnyFieldApi;
    /** Visible name of the list, e.g. "HTTP headers" */
    label: string;
    /** Names of the two inputs (default "Key", "Value") */
    keyLabel?: string;
    valueLabel?: string;
    keyPlaceholder?: string;
    valuePlaceholder?: string;
    min?: number;
    max?: number;
    /** Marks keys that occur more than once (default true) */
    uniqueKeys?: boolean;
    className?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof keyValueEditorRecipe>;
}

/** Key-value pairs (FormList preset): two inputs per row, duplicate keys marked */
export function KeyValueEditor({
    classes,
    field,
    label,
    keyLabel,
    valueLabel,
    keyPlaceholder,
    valuePlaceholder,
    min = 0,
    max,
    uniqueKeys = true,
    className,
}: KeyValueEditorProps) {
    const keyValueEditor = useRecipe('keyValueEditor', keyValueEditorRecipe, classes);
    const t = useTranslations().keyValueEditor;
    const styles = keyValueEditor();
    const id = useId();
    const pairs = useStore(field.store, (state) => state.value as KeyValuePair[] | undefined) ?? [];
    // Keys used more than once (empty keys do not count)
    const seen = new Map<string, number>();
    for (const pair of pairs) if (pair.key.trim()) seen.set(pair.key.trim(), (seen.get(pair.key.trim()) ?? 0) + 1);
    const isDuplicate = (index: number) => uniqueKeys && (seen.get(pairs[index]?.key.trim() ?? '') ?? 0) > 1;
    const set = (index: number, part: keyof KeyValuePair, value: string) =>
        field.replaceValue(index, { ...pairs[index], [part]: value });
    return (
        <FormList
            className={styles.base({ class: className })}
            field={field}
            label={label}
            newItem={() => ({ key: '', value: '' })}
            itemLabel={t.item}
            addLabel={t.add}
            min={min}
            max={max}
            renderItem={({ index, itemLabel }) => (
                <>
                    <Input
                        value={pairs[index]?.key ?? ''}
                        aria-label={`${keyLabel ?? t.key}, ${itemLabel}`}
                        placeholder={keyPlaceholder}
                        invalid={isDuplicate(index)}
                        aria-describedby={isDuplicate(index) ? `${id}-${index}` : undefined}
                        className={styles.cell()}
                        onChange={(event) => set(index, 'key', event.currentTarget.value)}
                    />
                    <Input
                        value={pairs[index]?.value ?? ''}
                        aria-label={`${valueLabel ?? t.value}, ${itemLabel}`}
                        placeholder={valuePlaceholder}
                        className={styles.cell()}
                        onChange={(event) => set(index, 'value', event.currentTarget.value)}
                    />
                    {isDuplicate(index) && (
                        <p id={`${id}-${index}`} className={styles.error()}>
                            {t.duplicate}
                        </p>
                    )}
                </>
            )}
        />
    );
}
