import { useFieldContext } from '@ark-ui/react/field';
import { Switch as ArkSwitch } from '@ark-ui/react/switch';
import { controlIds, switchControl as switchControlRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { useContext, useId, type ComponentProps, type ReactNode } from 'react';
import type { IconComponent } from '../../types.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';
import { SwitchGroupContext } from '../SwitchGroup/context.js';

export interface SwitchProps extends Omit<ComponentProps<'input'>, 'checked' | 'defaultChecked' | 'value' | 'type'> {
    checked?: boolean;
    defaultChecked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    /** Second line below the label, also read as the switch's description */
    description?: string;
    /** Icon component before the label */
    icon?: IconComponent;
    /** Icon in the thumb while on */
    checkedIcon?: IconComponent;
    /** Icon in the thumb while off */
    uncheckedIcon?: IconComponent;
    /** Short text in the track while on, e.g. "On" (decoration – the state is announced by the switch) */
    onLabel?: string;
    /** Short text in the track while off, e.g. "Off" */
    offLabel?: string;
    invalid?: boolean;
    value?: string;
    children?: ReactNode;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof switchControlRecipe>;
}

export function Switch({
    classes,
    checked,
    defaultChecked,
    onCheckedChange,
    description,
    icon: Icon,
    checkedIcon: CheckedIcon,
    uncheckedIcon: UncheckedIcon,
    onLabel,
    offLabel,
    disabled,
    invalid,
    required,
    name,
    value,
    id,
    className,
    style,
    children,
    ...props
}: SwitchProps) {
    const switchControl = useRecipe('switchControl', switchControlRecipe, classes);
    const withTrackLabel = !!(onLabel || offLabel);
    const styles = switchControl({ withThumbIcon: !!(CheckedIcon || UncheckedIcon), withTrackLabel });
    const descriptionId = useId();
    // An own id goes to the hidden input through Ark (it finds the input by its id)
    const field = useFieldContext();
    // Inside a SwitchGroup (with a value): state, name and disabled state come from the group
    const group = useContext(SwitchGroupContext);
    const grouped =
        group && value !== undefined
            ? {
                  checked: group.isChecked(value),
                  disabled: disabled ?? (group.disabled || group.blocked(value) || undefined),
                  invalid: invalid ?? group.invalid,
                  readOnly: group.readOnly,
                  name: name ?? group.name,
              }
            : undefined;
    const describedBy =
        [description && descriptionId, props['aria-describedby']].filter(Boolean).join(' ') || undefined;

    return (
        <ArkSwitch.Root
            className={styles.base({ class: className })}
            style={style}
            checked={checked}
            defaultChecked={defaultChecked}
            onCheckedChange={(details) => {
                if (grouped) group!.setChecked(value!, details.checked);
                onCheckedChange?.(details.checked);
            }}
            disabled={disabled}
            invalid={invalid}
            required={required}
            name={name}
            value={value}
            {...controlIds(id, 'hiddenInput', { label: field?.ids.label, hiddenInput: field?.ids.control })}
            {...grouped}
        >
            <span className={styles.content()}>
                {Icon && <Icon className={styles.icon()} aria-hidden="true" />}
                <span className={styles.text()}>
                    {/* Without a text the label is left out: Ark names the input by it, an empty one would hide a <label for> */}
                    {children && <ArkSwitch.Label className={styles.label()}>{children}</ArkSwitch.Label>}
                    {description && (
                        <span id={descriptionId} className={styles.description()}>
                            {description}
                        </span>
                    )}
                </span>
            </span>
            <ArkSwitch.Control className={styles.control()}>
                {CheckedIcon || UncheckedIcon || withTrackLabel ? (
                    <ArkSwitch.Context>
                        {(api) => {
                            const state = api.checked ? 'checked' : 'unchecked';
                            const ThumbIcon = api.checked ? CheckedIcon : UncheckedIcon;
                            const text = api.checked ? onLabel : offLabel;
                            return (
                                <>
                                    <ArkSwitch.Thumb className={styles.thumb()}>
                                        {ThumbIcon && (
                                            <ThumbIcon
                                                className={styles.thumbIcon()}
                                                data-state={state}
                                                aria-hidden="true"
                                            />
                                        )}
                                    </ArkSwitch.Thumb>
                                    {text && (
                                        <span className={styles.trackLabel()} data-state={state} aria-hidden="true">
                                            {text}
                                        </span>
                                    )}
                                </>
                            );
                        }}
                    </ArkSwitch.Context>
                ) : (
                    <ArkSwitch.Thumb className={styles.thumb()} />
                )}
            </ArkSwitch.Control>
            {/* Ark renders a plain checkbox; role="switch" makes screen readers announce it as a switch */}
            <ArkSwitch.HiddenInput {...props} role="switch" aria-describedby={describedBy} />
        </ArkSwitch.Root>
    );
}
