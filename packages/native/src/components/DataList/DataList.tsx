import { dataList } from '@wirecore/wirelayer-recipes/native';
import { createContext, useContext, type ReactNode } from 'react';
import { Text, View, type ViewProps } from 'react-native';

const DataListContext = createContext<{ orientation?: 'vertical' | 'horizontal'; divided?: boolean }>({});

export interface DataListProps extends ViewProps {
    /** Label above (default) or beside the value */
    orientation?: 'vertical' | 'horizontal';
    /** Lines between the items */
    divided?: boolean;
    className?: string;
    /** DataListItem elements */
    children?: ReactNode;
}

/** Facts as label and value pairs, e.g. the details of an order (a list; each item reads label, then value) */
export function DataList({ orientation, divided, className, children, ...props }: DataListProps) {
    return (
        <DataListContext.Provider value={{ orientation, divided }}>
            <View role="list" {...props} className={dataList({ orientation, divided }).base({ class: className })}>
                {children}
            </View>
        </DataListContext.Provider>
    );
}

export interface DataListItemProps extends ViewProps {
    /** The term */
    label: string;
    className?: string;
    /** The value – a string or own content */
    children?: ReactNode;
}

/** One label and value of a DataList */
export function DataListItem({ label, className, children, ...props }: DataListItemProps) {
    const styles = dataList(useContext(DataListContext));
    return (
        <View role="listitem" {...props} className={styles.item({ class: className })}>
            <Text className={styles.label()}>{label}</Text>
            {typeof children === 'string' || typeof children === 'number' ? (
                <Text className={styles.value()}>{children}</Text>
            ) : (
                <View className={styles.value()}>{children}</View>
            )}
        </View>
    );
}
