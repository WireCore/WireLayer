import { useFieldContext } from '@ark-ui/react/field';
import {
    knob as knobRecipe,
    knobArc,
    knobValueAt,
    knobValueForKey,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { useId, useState, type CSSProperties, type PointerEvent } from 'react';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';
import { useLabelForWarning } from '../../utils/label-for.js';

export interface KnobProps {
    value?: number;
    defaultValue?: number;
    onValueChange?: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    /** Visible label, also the accessible name */
    label?: string;
    'aria-label'?: string;
    /** Id of the dial (the slider); a `<label for>` cannot name it, use `label`, a Field or aria-label */
    id?: string;
    /** Formats the shown and announced value, e.g. (v) => `${v} %` */
    formatValue?: (value: number) => string;
    /** Text with the value in it, e.g. "{value} %" (when there is no formatValue) */
    valueTemplate?: string;
    /** Width of the arc (default 8, of a 100 wide dial) */
    strokeWidth?: number;
    /** Colour of the filled arc (default primary) */
    color?: 'primary' | 'info' | 'success' | 'warn' | 'danger' | 'contrast';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    name?: string;
    className?: string;
    style?: CSSProperties;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof knobRecipe>;
}

/**
 * Dial (270°): a slider – arrow keys, Page Up/Down, Home/End, or drag around the ring.
 * The ring is drawing only; the dial is the focusable slider.
 */
export function Knob({
    classes,
    value,
    defaultValue = 0,
    onValueChange,
    min = 0,
    max = 100,
    step = 1,
    label,
    'aria-label': ariaLabel,
    id,
    formatValue,
    valueTemplate,
    strokeWidth = 8,
    color = 'primary',
    size,
    disabled = false,
    name,
    className,
    style,
}: KnobProps) {
    useLabelForWarning('Knob', id);
    const knob = useRecipe('knob', knobRecipe, classes);
    const styles = knob({ size, color });
    const field = useFieldContext();
    const labelId = `${useId()}label`;
    const [internal, setInternal] = useState(defaultValue);
    const [dragging, setDragging] = useState(false);
    const current = value ?? internal;
    const set = (next: number) => {
        if (next === current) return;
        setInternal(next);
        onValueChange?.(next);
    };
    const fromPointer = (event: PointerEvent<HTMLDivElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        set(knobValueAt(x, y, min, max, step));
    };
    const text = formatValue
        ? formatValue(current)
        : (valueTemplate?.replaceAll('{value}', String(current)) ?? String(current));

    return (
        <div className={styles.base({ class: className })} style={style}>
            {label && (
                <span id={labelId} className={styles.label()}>
                    {label}
                </span>
            )}
            <div
                id={id}
                role="slider"
                tabIndex={disabled ? undefined : 0}
                aria-labelledby={label ? labelId : field?.ids.label}
                aria-label={label || field ? undefined : ariaLabel}
                aria-describedby={field?.ariaDescribedby}
                aria-valuemin={min}
                aria-valuemax={max}
                aria-valuenow={current}
                aria-valuetext={text}
                aria-disabled={disabled || undefined}
                data-disabled={disabled || undefined}
                data-dragging={dragging || undefined}
                className={styles.control()}
                onKeyDown={(event) => {
                    if (disabled) return;
                    const next = knobValueForKey(event.key, current, min, max, step);
                    if (next === undefined) return;
                    event.preventDefault();
                    set(next);
                }}
                onPointerDown={(event) => {
                    if (disabled) return;
                    event.currentTarget.setPointerCapture(event.pointerId);
                    setDragging(true);
                    fromPointer(event);
                }}
                onPointerMove={(event) => dragging && fromPointer(event)}
                onPointerUp={() => setDragging(false)}
                onPointerCancel={() => setDragging(false)}
            >
                <svg viewBox="0 0 100 100" className={styles.svg()} aria-hidden="true">
                    <path d={knobArc(1)} className={styles.track()} strokeWidth={strokeWidth} strokeLinecap="round" />
                    <path
                        d={knobArc((current - min) / (max - min))}
                        className={styles.range()}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                    />
                </svg>
                <span className={styles.value()} aria-hidden="true">
                    {text}
                </span>
            </div>
            {name && <input type="hidden" name={name} value={current} />}
        </div>
    );
}
