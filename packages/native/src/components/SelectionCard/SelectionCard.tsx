import { selectionCard } from '@wirecore/wirelayer-recipes/native';
import { Check, Minus } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useChoiceGroupItem } from '../../utils/choice-group.js';
import { Icon, type IconComponent } from '../../utils/Icon.js';
import { toggleOnSpace } from '../../utils/keyboard.js';
import { useControllable } from '../../utils/useControllable.js';
import type { CheckedState } from '../Checkbox/Checkbox.js';
import { useRadioGroup } from '../RadioGroup/RadioGroup.js';

interface CardContent {
    /** Title – the accessible name of the control */
    title: string;
    /** Text below the title – read as the description */
    description?: string;
    /** Icon component at the start */
    icon?: IconComponent;
    /** Price or other figure, e.g. "$29 / month" – part of the description */
    price?: string;
    /** More content below the description */
    children?: ReactNode;
    className?: string;
}

export interface CheckboxCardProps extends CardContent {
    /** Value inside a CheckboxGroup (the group holds the state) */
    value?: string;
    /** Controlled state (alone; in a CheckboxGroup the group holds the value) */
    checked?: CheckedState;
    defaultChecked?: CheckedState;
    onCheckedChange?: (checked: CheckedState) => void;
    invalid?: boolean;
    disabled?: boolean;
}

export interface RadioCardProps extends CardContent {
    /** Value of the option inside a RadioGroup */
    value: string;
    disabled?: boolean;
}

/** Width of a cell in a grid of cards (CheckboxGroup/RadioGroup `columns`) */
const cellStyle = (columns: number | undefined) =>
    columns && columns > 1 ? { width: `${100 / columns}%` as const } : undefined;

function CardBody({
    title,
    description,
    price,
    icon,
    children,
    styles,
}: CardContent & { styles: ReturnType<typeof selectionCard> }) {
    return (
        <>
            {icon && <Icon icon={icon} className={styles.icon()} />}
            <View className={styles.content()}>
                <Text className={styles.title()}>{title}</Text>
                {!!description && <Text className={styles.description()}>{description}</Text>}
                {!!price && <Text className={styles.description()}>{price}</Text>}
                {children}
            </View>
        </>
    );
}

/** A large card that is one checkbox: title (name), description and price (description), icon */
export function CheckboxCard({
    value,
    checked: checkedProp,
    defaultChecked = false,
    onCheckedChange,
    invalid = false,
    disabled = false,
    className,
    ...content
}: CheckboxCardProps) {
    const group = useChoiceGroupItem(value);
    const [own, setOwn] = useControllable(checkedProp, defaultChecked, onCheckedChange);
    const checked: CheckedState = group ? group.checked : own;
    const isDisabled = disabled || !!group?.disabled;
    const styles = selectionCard({
        type: 'checkbox',
        checked: checked !== false,
        invalid: invalid || !!group?.invalid,
    });
    const toggle = () => {
        if (group) {
            group.set(!group.checked);
            onCheckedChange?.(!group.checked);
        } else setOwn(checked !== true);
    };
    const description = [content.description, content.price].filter(Boolean).join(', ');
    return (
        <View className={styles.cell()} style={cellStyle(group?.columns)}>
            <Pressable
                role="checkbox"
                aria-checked={checked === 'indeterminate' ? 'mixed' : checked}
                aria-label={content.title}
                accessibilityHint={description || undefined}
                disabled={isDisabled}
                aria-disabled={isDisabled || undefined}
                className={styles.base({ class: className })}
                onPress={toggle}
                {...(isDisabled ? {} : toggleOnSpace(toggle))}
            >
                <CardBody {...content} styles={styles} />
                <View className={styles.control()}>
                    {checked !== false && <Icon icon={checked === true ? Check : Minus} className={styles.check()} />}
                </View>
            </Pressable>
        </View>
    );
}

/** A large card that is one option of a RadioGroup (use `columns` on the group for a grid) */
export function RadioCard({ value, disabled, className, ...content }: RadioCardProps) {
    const group = useRadioGroup();
    const checked = group.value === value;
    const isDisabled = disabled ?? group.disabled;
    const styles = selectionCard({ type: 'radio', checked, invalid: group.invalid });
    const choose = () => group.select(value);
    const description = [content.description, content.price].filter(Boolean).join(', ');
    return (
        <View className={styles.cell()} style={cellStyle(group.columns)}>
            <Pressable
                role="radio"
                aria-checked={checked}
                aria-label={content.title}
                accessibilityHint={description || undefined}
                disabled={isDisabled}
                aria-disabled={isDisabled || undefined}
                className={styles.base({ class: className })}
                onPress={choose}
                {...(isDisabled ? {} : toggleOnSpace(choose))}
            >
                <CardBody {...content} styles={styles} />
                <View className={styles.control()}>{checked && <View className={styles.dot()} />}</View>
            </Pressable>
        </View>
    );
}
