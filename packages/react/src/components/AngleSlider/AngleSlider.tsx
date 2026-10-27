import { AngleSlider as ArkAngleSlider } from '@ark-ui/react/angle-slider';
import { useFieldContext } from '@ark-ui/react/field';
import { controlIds, angleSlider as angleSliderRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { useState, type CSSProperties } from 'react';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';
import { useLabelForWarning } from '../../utils/label-for.js';

export interface AngleSliderProps {
    /** Angle 0–360 (controlled) */
    value?: number;
    defaultValue?: number;
    onValueChange?: (value: number) => void;
    /** The user let go (pointer released) */
    onValueChangeEnd?: (value: number) => void;
    /** Step of the arrow keys and of dragging (default 1) */
    step?: number;
    /** Visible label, also the accessible name (or a surrounding Field, or aria-label) */
    label?: string;
    /** Tick marks at these angles, e.g. [0, 90, 180, 270] */
    marks?: readonly number[];
    /** Shows the value below the dial (default true) */
    showValue?: boolean;
    /** Shown and announced text of the value (default "45°" shown, "45 degrees" announced) */
    formatValue?: (degrees: number) => string;
    disabled?: boolean;
    readOnly?: boolean;
    invalid?: boolean;
    name?: string;
    'aria-label'?: string;
    /** Id of the root element; a `<label for>` cannot name the angle slider, use a Field or aria-label */
    id?: string;
    className?: string;
    style?: CSSProperties;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof angleSliderRecipe>;
}

/** Dial for an angle: the needle is the slider (arrow keys, Home/End), drag anywhere on the dial */
export function AngleSlider({
    classes,
    value,
    defaultValue = 0,
    onValueChange,
    onValueChangeEnd,
    step = 1,
    label,
    marks,
    showValue = true,
    formatValue,
    disabled,
    readOnly,
    invalid,
    name,
    'aria-label': ariaLabel,
    id,
    className,
    style,
}: AngleSliderProps) {
    useLabelForWarning('AngleSlider', id);
    const angleSlider = useRecipe('angleSlider', angleSliderRecipe, classes);
    const styles = angleSlider();
    const field = useFieldContext();
    const t = useTranslations().angleSlider;
    const [internal, setInternal] = useState(defaultValue);
    const current = value ?? internal;
    const shown = formatValue ? formatValue(current) : `${current}°`;
    const spoken = formatValue ? formatValue(current) : t.value(current);
    return (
        <ArkAngleSlider.Root
            {...controlIds(id, 'root')}
            className={styles.base({ class: className })}
            style={style}
            value={value}
            defaultValue={defaultValue}
            step={step}
            disabled={disabled ?? field?.disabled}
            readOnly={readOnly ?? field?.readOnly}
            invalid={invalid ?? field?.invalid}
            name={name}
            aria-label={label || field ? undefined : (ariaLabel ?? t.label)}
            aria-labelledby={!label && field ? field.ids.label : undefined}
            onValueChange={(details) => {
                setInternal(details.value);
                onValueChange?.(details.value);
            }}
            onValueChangeEnd={(details) => onValueChangeEnd?.(details.value)}
        >
            {label && <ArkAngleSlider.Label className={styles.label()}>{label}</ArkAngleSlider.Label>}
            <ArkAngleSlider.Control className={styles.control()}>
                {!!marks?.length && (
                    <ArkAngleSlider.MarkerGroup className={styles.markers()}>
                        {marks.map((mark) => (
                            <ArkAngleSlider.Marker key={mark} value={mark} className={styles.marker()} />
                        ))}
                    </ArkAngleSlider.MarkerGroup>
                )}
                <ArkAngleSlider.Thumb
                    className={styles.thumb()}
                    aria-valuetext={spoken}
                    aria-describedby={field?.ariaDescribedby}
                />
            </ArkAngleSlider.Control>
            {showValue && (
                <span className={styles.value()} aria-hidden="true">
                    {shown}
                </span>
            )}
            <ArkAngleSlider.HiddenInput />
        </ArkAngleSlider.Root>
    );
}
