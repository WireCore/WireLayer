import { switchControl } from '@wirecore/wirelayer-recipes/native';
import { useEffect, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { Animated, Pressable, Text, View, type PressableProps } from 'react-native';
import { Icon, type IconComponent } from '../../utils/Icon.js';
import { toggleOnSpace } from '../../utils/keyboard.js';
import { useChoiceGroupItem } from '../../utils/choice-group.js';
import { useFocusTarget } from '../../utils/focus-registry.js';
import { useControllable } from '../../utils/useControllable.js';
import { useFieldId } from '../Field/Field.js';
import { nativeDriver } from '../../utils/motion.js';
import { useReducedMotion } from '../../utils/useReducedMotion.js';

export interface SwitchProps extends Omit<PressableProps, 'children'> {
    checked?: boolean;
    defaultChecked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    /** Second line below the label, also read as the switch's description */
    description?: string;
    /** Icon component before the label */
    icon?: IconComponent;
    invalid?: boolean;
    /** Value inside a SwitchGroup – the group holds the state */
    value?: string;
    className?: string;
    children?: ReactNode;
}

/** On/off switch (role switch) with label, description and icon; the thumb slides (not with reduced motion); works in a SwitchGroup */
export function Switch({
    checked: checkedProp,
    defaultChecked = false,
    onCheckedChange,
    description,
    icon,
    invalid: invalidProp = false,
    disabled: disabledProp = false,
    value,
    className,
    children,
    ...props
}: SwitchProps) {
    const group = useChoiceGroupItem(value);
    // Inside a Field with `id`: the target of FormErrorSummary
    const fieldId = useFieldId();
    const node = useRef<ComponentRef<typeof Pressable>>(null);
    useFocusTarget(fieldId, node);
    const [own, setOwn] = useControllable(checkedProp, defaultChecked, onCheckedChange);
    const checked = group ? group.checked : own;
    const setChecked = (next: boolean) => {
        if (group) {
            group.set(next);
            onCheckedChange?.(next);
        } else setOwn(next);
    };
    const invalid = invalidProp || !!group?.invalid;
    const disabled = !!disabledProp || !!group?.disabled;
    const styles = switchControl({ checked, invalid });
    const reducedMotion = useReducedMotion();
    // The thumb slides; its colours follow the recipe (checked variant)
    const [offset] = useState(() => new Animated.Value(checked ? 18 : 0));

    useEffect(() => {
        const to = checked ? 18 : 0;
        if (reducedMotion) {
            offset.setValue(to);
            return;
        }
        Animated.timing(offset, { toValue: to, duration: 150, useNativeDriver: nativeDriver }).start();
    }, [checked, reducedMotion, offset]);

    const toggle = () => setChecked(!checked);

    return (
        <Pressable
            ref={node}
            nativeID={fieldId}
            role="switch"
            {...props}
            className={styles.base({ class: className })}
            disabled={disabled}
            aria-checked={checked}
            aria-disabled={disabled || undefined}
            accessibilityHint={description}
            onPress={toggle}
            {...(disabled ? {} : toggleOnSpace(toggle))}
        >
            <View className={styles.content()}>
                {icon && <Icon icon={icon} className={styles.icon()} />}
                <View className={styles.text()}>
                    {typeof children === 'string' ? <Text className={styles.label()}>{children}</Text> : children}
                    {description && <Text className={styles.description()}>{description}</Text>}
                </View>
            </View>
            <View className={styles.control()}>
                <Animated.View className={styles.thumb()} style={{ transform: [{ translateX: offset }] }} />
            </View>
        </Pressable>
    );
}
