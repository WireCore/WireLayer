import { segmentedControl } from '@wirecore/wirelayer-recipes/native';
import { Pressable, Text, View, type ViewProps } from 'react-native';
import { Icon, type IconComponent } from '../../utils/Icon.js';
import { toggleOnSpace } from '../../utils/keyboard.js';
import { useControllable } from '../../utils/useControllable.js';

export interface SegmentedControlItem<V extends string = string> {
    value: V;
    label: string;
    icon?: IconComponent;
    disabled?: boolean;
}

/** `V`: the type of the values, e.g. a union like `'ssh' | 'sftp'` (default string) */
export interface SegmentedControlProps<V extends string = string> extends ViewProps {
    items: SegmentedControlItem<V>[];
    value?: V;
    defaultValue?: V;
    onValueChange?: (value: V) => void;
    /** Name of the group, e.g. "View" */
    label: string;
    size?: 'sm' | 'md';
    /** Full width: the segments share it */
    block?: boolean;
    disabled?: boolean;
    className?: string;
}

/** A few exclusive options side by side – a radio group */
export function SegmentedControl<V extends string = string>({
    items,
    value,
    defaultValue,
    onValueChange,
    label,
    size,
    block,
    disabled = false,
    className,
    ...props
}: SegmentedControlProps<V>) {
    const [current, setCurrent] = useControllable<V>(
        value,
        defaultValue ?? items[0]?.value ?? ('' as V),
        onValueChange
    );
    return (
        <View
            role="radiogroup"
            aria-label={label}
            aria-disabled={disabled || undefined}
            {...props}
            className={segmentedControl({ size, block }).base({ class: className })}
        >
            {items.map((item) => {
                const checked = item.value === current;
                const styles = segmentedControl({ checked, size, block });
                const off = disabled || !!item.disabled;
                return (
                    <Pressable
                        key={item.value}
                        role="radio"
                        aria-checked={checked}
                        disabled={off}
                        aria-disabled={off || undefined}
                        className={styles.item()}
                        onPress={() => setCurrent(item.value)}
                        {...(off ? {} : toggleOnSpace(() => setCurrent(item.value)))}
                    >
                        {item.icon && <Icon icon={item.icon} className={styles.icon()} />}
                        <Text className={styles.label()}>{item.label}</Text>
                    </Pressable>
                );
            })}
        </View>
    );
}
