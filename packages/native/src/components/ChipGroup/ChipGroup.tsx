import { chipGroup } from '@wirecore/wirelayer-recipes/native';
import { Check } from 'lucide-react-native';
import { Pressable, Text, View, type ViewProps } from 'react-native';
import { Icon, type IconComponent } from '../../utils/Icon.js';
import { toggleOnSpace } from '../../utils/keyboard.js';
import { useControllable } from '../../utils/useControllable.js';

export interface ChipGroupItem {
    value: string;
    label: string;
    icon?: IconComponent;
    disabled?: boolean;
}

export interface ChipGroupProps extends ViewProps {
    items: ChipGroupItem[];
    value?: string[];
    defaultValue?: string[];
    onValueChange?: (value: string[]) => void;
    /** Only one chip at a time (radio buttons instead of checkboxes) */
    single?: boolean;
    /** Several chips at once (default, same as the web); false is the same as `single` */
    multiple?: boolean;
    /** Name of the group, e.g. "Filter locations" */
    label: string;
    disabled?: boolean;
    className?: string;
}

/** Filter chips: checkboxes (several) or radio buttons (single); a checked chip shows a check mark too */
export function ChipGroup({
    items,
    value,
    defaultValue = [],
    onValueChange,
    single: singleProp = false,
    multiple = true,
    label,
    disabled = false,
    className,
    ...props
}: ChipGroupProps) {
    const single = singleProp || !multiple;
    const [current, setCurrent] = useControllable(value, defaultValue, onValueChange);
    const toggle = (item: string) =>
        setCurrent(
            current.includes(item) ? current.filter((entry) => entry !== item) : single ? [item] : [...current, item]
        );
    return (
        <View
            role={single ? 'radiogroup' : 'group'}
            aria-label={label}
            {...props}
            className={chipGroup().base({ class: className })}
        >
            {items.map((item) => {
                const checked = current.includes(item.value);
                const styles = chipGroup({ checked });
                const off = disabled || !!item.disabled;
                return (
                    <Pressable
                        key={item.value}
                        role={single ? 'radio' : 'checkbox'}
                        aria-checked={checked}
                        disabled={off}
                        aria-disabled={off || undefined}
                        className={styles.chip()}
                        onPress={() => toggle(item.value)}
                        {...(off ? {} : toggleOnSpace(() => toggle(item.value)))}
                    >
                        {checked ? (
                            <Icon icon={Check} className={styles.icon()} />
                        ) : (
                            item.icon && <Icon icon={item.icon} className={styles.icon()} />
                        )}
                        <Text className={styles.label()}>{item.label}</Text>
                    </Pressable>
                );
            })}
        </View>
    );
}
