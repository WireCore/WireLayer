import { checkbox } from '@wirecore/wirelayer-recipes/native';
import { Check, Minus } from 'lucide-react-native';
import { useRef, type ComponentRef, type ReactNode } from 'react';
import { Pressable, Text, View, type PressableProps } from 'react-native';
import { Icon } from '../../utils/Icon.js';
import { toggleOnSpace } from '../../utils/keyboard.js';
import { useChoiceGroupItem } from '../../utils/choice-group.js';
import { useFocusTarget } from '../../utils/focus-registry.js';
import { useControllable } from '../../utils/useControllable.js';
import { useFieldId } from '../Field/Field.js';

export type CheckedState = boolean | 'indeterminate';

/**
 * `C`: the state type – inferred from `checked`/`defaultChecked`, so a boolean `checked` gets booleans back in
 * onCheckedChange (the indeterminate state only comes from `checked`)
 */
export interface CheckboxProps<C extends CheckedState = CheckedState> extends Omit<PressableProps, 'children'> {
    checked?: C;
    defaultChecked?: C;
    onCheckedChange?: (checked: C) => void;
    invalid?: boolean;
    /** Value inside a CheckboxGroup – the group holds the state */
    value?: string;
    className?: string;
    /** Label – pressing it toggles the checkbox */
    children?: ReactNode;
}

/** Checkbox with label (also indeterminate): the whole row is the control; Space toggles on the web; works in a CheckboxGroup */
export function Checkbox<C extends CheckedState = CheckedState>({
    checked: checkedProp,
    defaultChecked = false as C,
    onCheckedChange,
    invalid: invalidProp = false,
    disabled: disabledProp = false,
    value,
    className,
    children,
    ...props
}: CheckboxProps<C>) {
    const group = useChoiceGroupItem(value);
    // Inside a Field with `id`: the target of FormErrorSummary
    const fieldId = useFieldId();
    const node = useRef<ComponentRef<typeof Pressable>>(null);
    useFocusTarget(fieldId, node);
    const [own, setOwn] = useControllable(checkedProp, defaultChecked, onCheckedChange);
    const checked: CheckedState = group ? group.checked : own;
    const invalid = invalidProp || !!group?.invalid;
    const disabled = !!disabledProp || !!group?.disabled;
    const styles = checkbox({ checked: checked !== false, invalid });

    const toggle = () => {
        if (group) {
            group.set(!group.checked);
            onCheckedChange?.(!group.checked as C);
        } else setOwn((checked !== true) as C);
    };

    // The whole row is the control: label and box are one touch target with one accessible name
    return (
        <Pressable
            ref={node}
            nativeID={fieldId}
            role="checkbox"
            {...props}
            className={styles.base({ class: className })}
            disabled={disabled}
            aria-checked={checked === 'indeterminate' ? 'mixed' : checked}
            aria-disabled={disabled || undefined}
            {...({ 'aria-invalid': invalid || undefined } as object)}
            onPress={toggle}
            {...(disabled ? {} : toggleOnSpace(toggle))}
        >
            <View className={styles.control()}>
                {checked !== false && <Icon icon={checked === true ? Check : Minus} className={styles.icon()} />}
            </View>
            {typeof children === 'string' ? <Text className={styles.label()}>{children}</Text> : children}
        </Pressable>
    );
}
