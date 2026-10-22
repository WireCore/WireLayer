import { checkbox, dataTable, type DataTableSort } from '@wirecore/wirelayer-recipes/native';
import { Check } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { Button } from '../components/Button/Button.js';
import { SegmentedControl } from '../components/SegmentedControl/SegmentedControl.js';
import { useTranslations } from '../locale.js';
import { Icon } from '../utils/Icon.js';
import { toggleOnSpace } from '../utils/keyboard.js';
import { Sheet } from '../utils/Sheet.js';
import type { DataTableColumn } from './types.js';

export interface SortSheetProps<TData> {
    open: boolean;
    onClose: () => void;
    /** The sortable columns */
    columns: DataTableColumn<TData>[];
    sorting: DataTableSort[];
    /** `multiple`: several columns (checkboxes, in the order chosen), else one (radio buttons) */
    multiple: boolean;
    onSortingChange: (sorting: DataTableSort[]) => void;
}

/**
 * Sorting in a sheet, for cards and table alike: the column as a radio group (several columns as checkboxes with
 * their priority), the direction per sorted column, "Clear sorting". Changes apply at once.
 */
export function SortSheet<TData>({
    open,
    onClose,
    columns,
    sorting,
    multiple,
    onSortingChange,
}: SortSheetProps<TData>) {
    const translations = useTranslations();
    const t = translations.dataTable;
    const styles = dataTable();
    const choose = (id: string) => {
        const position = sorting.findIndex((sort) => sort.id === id);
        if (!multiple) onSortingChange([{ id, desc: position === 0 ? sorting[0]!.desc : false }]);
        else if (position >= 0) onSortingChange(sorting.filter((sort) => sort.id !== id));
        else onSortingChange([...sorting, { id, desc: false }]);
    };

    return (
        <Sheet
            open={open}
            onClose={onClose}
            title={t.sortBy}
            closeLabel={translations.common.close}
            focusClose
            footer={
                sorting.length > 0 && (
                    <Button variant="outline" onPress={() => onSortingChange([])}>
                        {t.clearSort}
                    </Button>
                )
            }
        >
            <View className={styles.sheetBody()}>
                <View role={multiple ? 'group' : 'radiogroup'} aria-label={t.sortBy}>
                    {columns.map((column) => {
                        const position = sorting.findIndex((sort) => sort.id === column.id);
                        const checked = position >= 0;
                        const state = checked && multiple ? t.sortPriority(position + 1, sorting[position]!.desc) : '';
                        const toggle = () => choose(column.id);
                        const box = checkbox({ checked });
                        const radio = dataTable({ checked });
                        return (
                            <Pressable
                                key={column.id}
                                role={multiple ? 'checkbox' : 'radio'}
                                aria-checked={checked}
                                className={styles.option()}
                                onPress={toggle}
                                {...toggleOnSpace(toggle)}
                            >
                                {multiple ? (
                                    <View className={box.control()}>
                                        {checked && <Icon icon={Check} className={box.icon()} />}
                                    </View>
                                ) : (
                                    <View className={radio.radioControl()}>
                                        {checked && <View className={radio.radioDot()} />}
                                    </View>
                                )}
                                <Text className={styles.optionText()}>
                                    {state ? `${column.header}, ${state}` : column.header}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
                {sorting.map((sort, index) => {
                    const column = columns.find((entry) => entry.id === sort.id);
                    if (!column) return null;
                    return (
                        <View key={sort.id} className={styles.sheetSection()}>
                            <Text className={styles.sheetLabel()} aria-hidden>
                                {column.header}
                            </Text>
                            <SegmentedControl
                                label={column.header}
                                value={sort.desc ? 'desc' : 'asc'}
                                onValueChange={(next) =>
                                    onSortingChange(
                                        sorting.map((entry, position) =>
                                            position === index ? { ...entry, desc: next === 'desc' } : entry
                                        )
                                    )
                                }
                                items={[
                                    { value: 'asc', label: t.sortAscending },
                                    { value: 'desc', label: t.sortDescending },
                                ]}
                            />
                        </View>
                    );
                })}
            </View>
        </Sheet>
    );
}
