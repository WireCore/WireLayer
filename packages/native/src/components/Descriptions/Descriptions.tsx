import { descriptions, responsiveColumnCount, type ResponsiveColumns } from '@wirecore/wirelayer-recipes/native';
import { useId, useState, type ReactNode } from 'react';
import { Text, useWindowDimensions, View, type ViewProps } from 'react-native';

export interface DescriptionsItem {
    /** Key (default: the position) */
    id?: string;
    label: string;
    value?: string | number;
    /** Columns it spans, `full` the whole row */
    span?: number | 'full';
}

export interface DescriptionsProps extends ViewProps {
    items: DescriptionsItem[];
    /** Heading above the list */
    title?: string;
    /** Level of the heading (default 3) */
    headingLevel?: 2 | 3 | 4 | 5 | 6;
    /** Buttons next to the title */
    actions?: ReactNode;
    /** Columns by the width of the list (default `{ base: 1, sm: 2, lg: 3 }`) */
    columns?: ResponsiveColumns;
    /** Label above (default) or beside the value */
    orientation?: 'vertical' | 'horizontal';
    /** Table look with lines */
    bordered?: boolean;
    /** The values give way to `renderEdit` */
    editing?: boolean;
    /** Own content of a value */
    renderValue?: (item: DescriptionsItem) => ReactNode;
    /** Input of an item while editing – `labelId` names it (aria-labelledby) */
    renderEdit?: (item: DescriptionsItem, context: { labelId: string }) => ReactNode;
    className?: string;
}

/** Facts in columns (one on a phone, more on a tablet), with title, actions and an edit mode */
export function Descriptions({
    items,
    title,
    headingLevel = 3,
    actions,
    columns = { base: 1, sm: 2, lg: 3 },
    orientation,
    bordered,
    editing = false,
    renderValue,
    renderEdit,
    className,
    ...props
}: DescriptionsProps) {
    const styles = descriptions({ orientation, bordered });
    const id = useId();
    const window = useWindowDimensions();
    const [width, setWidth] = useState<number | null>(null);
    const count = Math.max(1, responsiveColumnCount(columns, width ?? window.width));
    return (
        <View {...props} className={styles.base({ class: className })}>
            {(!!title || !!actions) && (
                <View className={styles.header()}>
                    {!!title && (
                        <Text role="heading" aria-level={headingLevel} className={styles.title()}>
                            {title}
                        </Text>
                    )}
                    {!!actions && <View className={styles.actions()}>{actions}</View>}
                </View>
            )}
            <View role="list" className={styles.grid()} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
                {items.map((item, index) => {
                    const span = item.span === 'full' ? count : Math.min(item.span ?? 1, count);
                    const labelId = `${id}-${index}`;
                    const value = renderValue ? renderValue(item) : item.value;
                    return (
                        <View
                            key={item.id ?? index}
                            role="listitem"
                            className={styles.item()}
                            style={{ width: `${(span / count) * 100}%` }}
                        >
                            <Text nativeID={labelId} className={styles.label()}>
                                {item.label}
                            </Text>
                            {editing && renderEdit ? (
                                renderEdit(item, { labelId })
                            ) : typeof value === 'string' || typeof value === 'number' ? (
                                <Text className={styles.value()}>{value}</Text>
                            ) : (
                                (value ?? <Text className={styles.value()}>–</Text>)
                            )}
                        </View>
                    );
                })}
            </View>
        </View>
    );
}
