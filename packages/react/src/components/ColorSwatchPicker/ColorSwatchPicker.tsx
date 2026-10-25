import { RadioGroup as ArkRadioGroup } from '@ark-ui/react/radio-group';
import { colorSwatchPicker as colorSwatchPickerRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { Check } from 'lucide-react';
import type { ComponentProps } from 'react';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface ColorSwatch {
    /** CSS colour, e.g. "#1e66f5" or "var(--wc-primary)" – also the value */
    value: string;
    /** Name of the color, e.g. "Blue" (its accessible name) */
    label: string;
    disabled?: boolean;
}

export interface ColorSwatchPickerProps extends Omit<ComponentProps<'div'>, 'defaultValue' | 'dir' | 'children'> {
    /** The colours to choose from */
    items: readonly ColorSwatch[];
    /** Chosen colour (its value, controlled) */
    value?: string | null;
    defaultValue?: string | null;
    onValueChange?: (value: string | null) => void;
    /** Visible label of the group (default "Color"; or aria-label) */
    label?: string;
    /** Shows the names below the swatches (otherwise only for screen readers) */
    showLabels?: boolean;
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    invalid?: boolean;
    required?: boolean;
    name?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof colorSwatchPickerRecipe>;
}

/** Colours as a radio group (arrow keys): every swatch is named by its colour name, the chosen one has a tick */
export function ColorSwatchPicker({
    classes,
    items,
    value,
    defaultValue,
    onValueChange,
    label,
    showLabels,
    size,
    disabled,
    invalid,
    required,
    name,
    className,
    ...props
}: ColorSwatchPickerProps) {
    const colorSwatchPicker = useRecipe('colorSwatchPicker', colorSwatchPickerRecipe, classes);
    const styles = colorSwatchPicker({ size, showLabels });
    const t = useTranslations().colorSwatchPicker;
    return (
        <ArkRadioGroup.Root
            {...props}
            className={styles.base({ class: className })}
            value={value}
            defaultValue={defaultValue}
            onValueChange={(details) => onValueChange?.(details.value)}
            orientation="horizontal"
            disabled={disabled}
            invalid={invalid}
            required={required}
            name={name}
        >
            {!props['aria-label'] && !props['aria-labelledby'] && (
                <ArkRadioGroup.Label className={styles.label()}>{label ?? t.label}</ArkRadioGroup.Label>
            )}
            <div className={styles.items()}>
                {items.map((item) => (
                    <ArkRadioGroup.Item
                        key={item.value}
                        value={item.value}
                        disabled={item.disabled}
                        className={styles.item()}
                    >
                        <ArkRadioGroup.ItemControl className={styles.swatch()} style={{ background: item.value }}>
                            <ArkRadioGroup.Context>
                                {(api) =>
                                    api.value === item.value && <Check className={styles.check()} aria-hidden="true" />
                                }
                            </ArkRadioGroup.Context>
                        </ArkRadioGroup.ItemControl>
                        <ArkRadioGroup.ItemText className={styles.text()}>{item.label}</ArkRadioGroup.ItemText>
                        <ArkRadioGroup.ItemHiddenInput />
                    </ArkRadioGroup.Item>
                ))}
            </div>
        </ArkRadioGroup.Root>
    );
}
