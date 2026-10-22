import { segmentedControl } from '@wirecore/wirelayer-recipes/native';
import { Pressable, Text, View, type ViewProps } from 'react-native';
import { Icon, type IconComponent } from '../../utils/Icon.js';
import { toggleOnSpace } from '../../utils/keyboard.js';
import { useControllable } from '../../utils/useControllable.js';

export interface SegmentedControlItem {
    value: string;
    label: string;
    icon?: IconComponent;
    disabled?: boolean;
}

export interface SegmentedControlProps extends ViewProps {
    items: SegmentedControlItem[];
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    /** Name of the group, e.g. "View" */
    label: string;
    size?: 'sm' | 'md';
    /** Full width: the segments share it */
    block?: boolean;
    disabled?: boolean;
    className?: string;
}

/** A few exclusive options side by side – a radio group */
export function SegmentedControl({
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
}: SegmentedControlProps) {
    const [current, setCurrent] = useControllable(value, defaultValue ?? items[0]?.value ?? '', onValueChange);
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
