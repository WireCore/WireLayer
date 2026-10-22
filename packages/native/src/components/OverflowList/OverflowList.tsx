import { overflowList, overflowVisibleCount } from '@wirecore/wirelayer-recipes/native';
import { useState, type ReactNode } from 'react';
import { Pressable, Text, View, type ViewProps } from 'react-native';
import { useTranslations } from '../../locale.js';
import { Sheet } from '../../utils/Sheet.js';

export interface OverflowListProps<T> extends Omit<ViewProps, 'children'> {
    items: readonly T[];
    /** One item – in the row and in the sheet */
    renderItem: (item: T, index: number) => ReactNode;
    /** Own content of the sheet for the hidden items */
    renderOverflow?: (items: T[]) => ReactNode;
    /** At most this many visible */
    maxVisible?: number;
    /** Rows before the rest is hidden (default 1) */
    maxRows?: number;
    /** Which items are hidden first (default end) */
    collapseFrom?: 'end' | 'start';
    /** Accessible name of the list */
    label?: string;
    /** Title of the sheet (default "More items") */
    overflowTitle?: string;
    className?: string;
}

const gap = 6;

/** A row of items (chips, avatars, tags) that shows as many as fit and "+N" for the rest – a tap opens them in a sheet */
export function OverflowList<T>({
    items,
    renderItem,
    renderOverflow,
    maxVisible,
    maxRows = 1,
    collapseFrom = 'end',
    label,
    overflowTitle,
    className,
    ...props
}: OverflowListProps<T>) {
    const translations = useTranslations();
    const styles = overflowList();
    const [available, setAvailable] = useState(0);
    const [widths, setWidths] = useState<number[]>([]);
    const [moreWidth, setMoreWidth] = useState(48);
    const [open, setOpen] = useState(false);

    const measured = widths.length === items.length && widths.every((width) => width > 0);
    const count = overflowVisibleCount({
        widths: measured ? widths : items.map(() => 0),
        available: measured ? available : 0,
        moreWidth,
        gap,
        maxVisible,
        maxRows,
        collapseFrom,
    });
    const indexed = items.map((item, index) => ({ item, index }));
    const visible = collapseFrom === 'start' ? indexed.slice(items.length - count) : indexed.slice(0, count);
    const hidden = collapseFrom === 'start' ? indexed.slice(0, items.length - count) : indexed.slice(count);
    const title = overflowTitle ?? translations.overflowList.title;

    const more = hidden.length > 0 && (
        <View role="listitem">
            <Pressable
                role="button"
                aria-label={`+${hidden.length} ${translations.overflowList.more}`}
                {...({ 'aria-haspopup': 'dialog' } as object)}
                className={styles.more()}
                onPress={() => setOpen(true)}
                onLayout={(event) => setMoreWidth(event.nativeEvent.layout.width)}
            >
                <Text className={styles.moreLabel()}>+{hidden.length}</Text>
            </Pressable>
        </View>
    );

    return (
        <View
            {...props}
            className={styles.root({ class: className })}
            onLayout={(event) => setAvailable(event.nativeEvent.layout.width)}
        >
            {/* All items in one invisible row – their widths decide how many fit */}
            <View className={styles.measure()} aria-hidden pointerEvents="none">
                {items.map((item, index) => (
                    <View
                        key={index}
                        onLayout={(event) => {
                            const width = event.nativeEvent.layout.width;
                            setWidths((current) => {
                                if (current[index] === width && current.length === items.length) return current;
                                const next = items.map((_, position) => current[position] ?? 0);
                                next[index] = width;
                                return next;
                            });
                        }}
                    >
                        {renderItem(item, index)}
                    </View>
                ))}
            </View>
            <View role="list" aria-label={label} className={styles.base()}>
                {collapseFrom === 'start' && more}
                {visible.map(({ item, index }) => (
                    <View key={index} role="listitem">
                        {renderItem(item, index)}
                    </View>
                ))}
                {collapseFrom === 'end' && more}
            </View>
            <Sheet
                open={open}
                onClose={() => setOpen(false)}
                title={title}
                closeLabel={translations.common.close}
                focusClose
            >
                {renderOverflow ? (
                    renderOverflow(hidden.map(({ item }) => item))
                ) : (
                    <View role="list" className={styles.sheetList()}>
                        {hidden.map(({ item, index }) => (
                            <View key={index} role="listitem">
                                {renderItem(item, index)}
                            </View>
                        ))}
                    </View>
                )}
            </Sheet>
        </View>
    );
}
