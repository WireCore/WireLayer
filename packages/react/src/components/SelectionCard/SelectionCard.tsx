import { Checkbox as ArkCheckbox } from '@ark-ui/react/checkbox';
import { useFieldContext } from '@ark-ui/react/field';
import { RadioGroup as ArkRadioGroup } from '@ark-ui/react/radio-group';
import { controlIds, selectionCard as selectionCardRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { Check } from 'lucide-react';
import { useId, type ComponentProps, type ReactNode } from 'react';
import type { IconComponent } from '../../types.js';
import type { CheckedState } from '../Checkbox/Checkbox.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

interface CardContent {
    /** Title – the accessible name of the control */
    title: string;
    /** Text below the title – read as the description */
    description?: string;
    /** Icon component in a box at the start */
    icon?: IconComponent;
    /** Price or other figure at the end, e.g. "$29 / month" – part of the description */
    price?: string;
    /** More content below the description */
    children?: ReactNode;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof selectionCardRecipe>;
}

export interface CheckboxCardProps
    extends
        CardContent,
        Omit<ComponentProps<'input'>, 'checked' | 'defaultChecked' | 'value' | 'type' | 'title' | 'children'> {
    /** Value inside a CheckboxGroup */
    value?: string;
    /** Controlled state (alone; in a CheckboxGroup the group holds the value) */
    checked?: CheckedState;
    defaultChecked?: CheckedState;
    onCheckedChange?: (checked: CheckedState) => void;
    invalid?: boolean;
}

/** A large card that is one checkbox: title (name), description and price (description), icon */
export function CheckboxCard({
    classes,
    title,
    description,
    icon: Icon,
    price,
    value,
    checked,
    defaultChecked,
    onCheckedChange,
    disabled,
    invalid,
    required,
    name,
    id,
    className,
    style,
    children,
    ...props
}: CheckboxCardProps) {
    const selectionCard = useRecipe('selectionCard', selectionCardRecipe, classes);
    const styles = selectionCard({ type: 'checkbox' });
    const uid = useId();
    // An own id goes to the hidden input through Ark (it finds the input by its id)
    const field = useFieldContext();
    const describedBy =
        [description && `${uid}description`, price && `${uid}price`].filter(Boolean).join(' ') || undefined;
    return (
        <ArkCheckbox.Root
            className={styles.base({ class: className })}
            style={style}
            checked={checked}
            defaultChecked={defaultChecked}
            onCheckedChange={(details) => onCheckedChange?.(details.checked)}
            disabled={disabled}
            invalid={invalid}
            required={required}
            name={name}
            value={value}
            {...controlIds(id, 'hiddenInput', { label: field?.ids.label, hiddenInput: field?.ids.control })}
        >
            {Icon && (
                <span className={styles.icon()}>
                    <Icon className={styles.iconSvg()} aria-hidden="true" />
                </span>
            )}
            <span className={styles.body()}>
                <span className={styles.heading()}>
                    <ArkCheckbox.Label className={styles.title()}>{title}</ArkCheckbox.Label>
                    {price && (
                        <span id={`${uid}price`} className={styles.price()}>
                            {price}
                        </span>
                    )}
                </span>
                {description && (
                    <span id={`${uid}description`} className={styles.description()}>
                        {description}
                    </span>
                )}
                {children}
            </span>
            <ArkCheckbox.Control className={styles.control()}>
                <ArkCheckbox.Indicator>
                    <Check className={styles.controlIcon()} aria-hidden="true" />
                </ArkCheckbox.Indicator>
            </ArkCheckbox.Control>
            <ArkCheckbox.HiddenInput {...props} aria-describedby={describedBy} />
        </ArkCheckbox.Root>
    );
}

export interface RadioCardProps extends CardContent, Omit<ComponentProps<'label'>, 'title' | 'children'> {
    /** Value of the option inside a RadioGroup */
    value: string;
    disabled?: boolean;
}

/** A large card that is one option of a RadioGroup (use `columns` on the group for a grid) */
export function RadioCard({
    classes,
    title,
    description,
    icon: Icon,
    price,
    value,
    disabled,
    className,
    children,
    ...props
}: RadioCardProps) {
    const selectionCard = useRecipe('selectionCard', selectionCardRecipe, classes);
    const styles = selectionCard({ type: 'radio' });
    const id = useId();
    const describedBy =
        [description && `${id}description`, price && `${id}price`].filter(Boolean).join(' ') || undefined;
    return (
        <ArkRadioGroup.Item {...props} className={styles.base({ class: className })} value={value} disabled={disabled}>
            {Icon && (
                <span className={styles.icon()}>
                    <Icon className={styles.iconSvg()} aria-hidden="true" />
                </span>
            )}
            <span className={styles.body()}>
                <span className={styles.heading()}>
                    <ArkRadioGroup.ItemText className={styles.title()}>{title}</ArkRadioGroup.ItemText>
                    {price && (
                        <span id={`${id}price`} className={styles.price()}>
                            {price}
                        </span>
                    )}
                </span>
                {description && (
                    <span id={`${id}description`} className={styles.description()}>
                        {description}
                    </span>
                )}
                {children}
            </span>
            <ArkRadioGroup.ItemControl className={styles.control()} />
            <ArkRadioGroup.ItemHiddenInput aria-describedby={describedBy} />
        </ArkRadioGroup.Item>
    );
}
