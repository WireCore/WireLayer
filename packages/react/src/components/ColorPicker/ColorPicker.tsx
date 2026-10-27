import { ColorPicker as ArkColorPicker, parseColor } from '@ark-ui/react/color-picker';
import { useFieldContext } from '@ark-ui/react/field';
import {
    controlIds,
    colorPicker as colorPickerRecipe,
    formatColor,
    parseColorText,
    type ColorFormat,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { useId, useMemo, type CSSProperties } from 'react';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';
import { ColorPickerContent } from './ColorPickerContent.js';

export interface ColorPickerProps {
    /** Colour, e.g. "#1e66f5" ("#1e66f580" with alpha; in `format`) */
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    /** Called once the user lets go */
    onValueChangeEnd?: (value: string) => void;
    /** Adds an opacity slider; the value then has 8 hex digits */
    alpha?: boolean;
    /** Preset colours shown below the picker */
    swatches?: readonly string[];
    /** Format of the value: hex (default), rgb, hsl, hsb or oklch – e.g. "oklch(55.4% 0.218 262.9)" */
    format?: ColorFormat;
    /** Area and sliders in the popup (default true); false: only the `swatches` (a palette) */
    withPicker?: boolean;
    /** Button to pick a colour from the screen (where the browser supports it) */
    eyeDropper?: boolean;
    /** Number fields for the channels, switchable between RGB, HSL, HSB and OKLCH */
    channelInputs?: boolean;
    disabled?: boolean;
    readOnly?: boolean;
    invalid?: boolean;
    name?: string;
    /** Accessible name without a surrounding Field */
    'aria-label'?: string;
    /** Id of the field (the button), e.g. for a `<label for>` */
    id?: string;
    className?: string;
    style?: CSSProperties;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof colorPickerRecipe>;
}

/** Colour field: the button opens a panel with area, hue (and opacity) slider, hex input and presets */
export function ColorPicker({
    classes,
    value,
    defaultValue = '#000000',
    onValueChange,
    onValueChangeEnd,
    alpha = false,
    swatches,
    format = 'hex',
    withPicker = true,
    eyeDropper = false,
    channelInputs = false,
    disabled,
    readOnly,
    invalid,
    name,
    'aria-label': ariaLabel,
    id,
    className,
    style,
}: ColorPickerProps) {
    const colorPicker = useRecipe('colorPicker', colorPickerRecipe, classes);
    const styles = colorPicker({ cssText: format !== 'hex' });
    const translations = useTranslations();
    const text = translations.colorPicker;
    const field = useFieldContext();
    const uid = useId();
    const nameId = `${uid}name`;
    const valueId = `${uid}value`;
    // An own id goes to the button through Ark (it finds the button by its id). Named by a <label for>, the button
    // describes itself by the value (an empty aria-label lets the label count, not Ark's text)
    const ownLabel = !field && !!id && !ariaLabel;
    const hexFormat = alpha ? 'hexa' : 'hex';
    // Values in other formats (oklch() …) are read here; Ark knows hex, rgb, hsl and hsb
    const parsed = useMemo(
        () => (value === undefined ? undefined : parseColor(parseColorText(value) ?? value)),
        [value]
    );
    const initial = useMemo(() => parseColor(parseColorText(defaultValue) ?? defaultValue), [defaultValue]);
    /** The value as text in the chosen format */
    const textOf = (color: { toString(format: 'hex' | 'hexa'): string }) =>
        format === 'hex' ? color.toString(hexFormat) : formatColor(color.toString(hexFormat), format);

    return (
        <ArkColorPicker.Root
            className={styles.base({ class: className })}
            style={style}
            value={parsed}
            defaultValue={initial}
            onValueChange={(details) => onValueChange?.(textOf(details.value))}
            onValueChangeEnd={(details) => onValueChangeEnd?.(textOf(details.value))}
            disabled={disabled ?? field?.disabled}
            readOnly={readOnly ?? field?.readOnly}
            invalid={invalid ?? field?.invalid}
            name={name}
            positioning={{ placement: 'bottom-start', gutter: 4 }}
            {...controlIds(id, 'trigger', { label: field?.ids.label, input: field?.ids.control })}
            lazyMount
            unmountOnExit
        >
            <ArkColorPicker.Context>
                {(api) => {
                    const current = textOf(api.value);
                    return (
                        <ArkColorPicker.Control className={styles.control()}>
                            {/* Named by the Field label (or aria-label) plus the current value, which is visible */}
                            <ArkColorPicker.Trigger
                                className={styles.trigger()}
                                aria-label={ownLabel ? '' : text.trigger(current)}
                                aria-labelledby={
                                    ownLabel ? undefined : `${field ? field.ids.label : nameId} ${valueId}`
                                }
                                aria-describedby={ownLabel ? valueId : field?.ariaDescribedby}
                            >
                                {!field && !ownLabel && (
                                    <span id={nameId} className={styles.hiddenName()}>
                                        {ariaLabel ?? text.name}
                                    </span>
                                )}
                                <ArkColorPicker.ValueSwatch className={styles.swatch()} />
                                <span id={valueId} className={styles.valueText()}>
                                    {current}
                                </span>
                            </ArkColorPicker.Trigger>
                        </ArkColorPicker.Control>
                    );
                }}
            </ArkColorPicker.Context>
            <ColorPickerContent
                alpha={alpha}
                swatches={swatches}
                withPicker={withPicker}
                eyeDropper={eyeDropper}
                channelInputs={channelInputs}
                classes={classes}
            />
            {/* Only for form submission – Ark renders it as an unlabelled text input */}
            {name && <ArkColorPicker.HiddenInput aria-hidden="true" />}
        </ArkColorPicker.Root>
    );
}
