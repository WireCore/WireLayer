import { useStore, type AnyFieldApi } from '@tanstack/react-form';
import { formList } from '@wirecore/wirelayer-recipes/native';
import { Text } from 'react-native';
import { Input } from '../components/Input/Input.js';
import { useTranslations } from '../locale.js';
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
}

/** Key-value pairs (FormList preset): two inputs per row, duplicate keys marked */
export function KeyValueEditor({
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
    const t = useTranslations().keyValueEditor;
    const styles = formList();
    const pairs = useStore(field.store, (state) => state.value as KeyValuePair[] | undefined) ?? [];
    const seen = new Map<string, number>();
    for (const pair of pairs) if (pair.key.trim()) seen.set(pair.key.trim(), (seen.get(pair.key.trim()) ?? 0) + 1);
    const isDuplicate = (index: number) => uniqueKeys && (seen.get(pairs[index]?.key.trim() ?? '') ?? 0) > 1;
    const set = (index: number, part: keyof KeyValuePair, value: string) =>
        field.replaceValue(index, { ...pairs[index], [part]: value });
    return (
        <FormList
            className={className}
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
                        accessibilityHint={isDuplicate(index) ? t.duplicate : undefined}
                        autoCapitalize="none"
                        onChangeText={(text) => set(index, 'key', text)}
                    />
                    <Input
                        value={pairs[index]?.value ?? ''}
                        aria-label={`${valueLabel ?? t.value}, ${itemLabel}`}
                        placeholder={valuePlaceholder}
                        autoCapitalize="none"
                        onChangeText={(text) => set(index, 'value', text)}
                    />
                    {isDuplicate(index) && <Text className={styles.error()}>{t.duplicate}</Text>}
                </>
            )}
        />
    );
}
