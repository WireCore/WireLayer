import { divider } from '@wirecore/wirelayer-recipes/native';
import { Text, View, type ViewProps } from 'react-native';

export interface DividerProps extends ViewProps {
    orientation?: 'horizontal' | 'vertical';
    /** Text in the middle, e.g. "or" – the lines are then decoration and the text is read */
    label?: string;
    /** solid (default), dashed or dotted */
    lineStyle?: 'solid' | 'dashed' | 'dotted';
    /** Where the label sits on the line (default center) */
    labelPosition?: 'start' | 'center' | 'end';
    className?: string;
}

/** Without a label a separator; with a label the lines are decorative */
export function Divider({
    orientation = 'horizontal',
    label,
    lineStyle,
    labelPosition = 'center',
    className,
    ...props
}: DividerProps) {
    const styles = divider({ orientation, lineStyle });
    if (orientation === 'vertical')
        return (
            <View
                role="separator"
                aria-orientation="vertical"
                {...props}
                className={styles.base({ class: className })}
            />
        );
    if (label)
        return (
            <View {...props} className={styles.base({ class: className })}>
                <View
                    className={styles.line({ class: labelPosition === 'start' ? styles.edgeLine() : undefined })}
                    aria-hidden
                />
                <Text className={styles.label()}>{label}</Text>
                <View
                    className={styles.line({ class: labelPosition === 'end' ? styles.edgeLine() : undefined })}
                    aria-hidden
                />
            </View>
        );
    return (
        <View role="separator" {...props} className={styles.base({ class: className })}>
            <View className={styles.line()} />
        </View>
    );
}
