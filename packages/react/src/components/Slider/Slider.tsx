import { Slider as ArkSlider } from '@ark-ui/react/slider';
import { slider as sliderRecipe, snapToMarks, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { useId, useState, type ComponentProps } from 'react';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface SliderProps extends Omit<
    ComponentProps<'div'>,
    'defaultValue' | 'dir' | 'aria-label' | 'aria-labelledby'
> {
    /** One value per thumb – two values make a range slider */
    value?: number[];
    defaultValue?: number[];
    onValueChange?: (value: number[]) => void;
    /** Called once the user lets go (pointer up, key up) */
    onValueChangeEnd?: (value: number[]) => void;
    min?: number;
    max?: number;
    step?: number;
    /** Visible label, also the accessible name of the thumbs */
    label: string;
    /** Names of the thumbs of a range slider, read after the label */
    thumbLabels?: string[];
    /** Shows the formatted value next to the label */
    showValue?: boolean;
    /** Formats the shown and announced value, e.g. (v) => `${v} %` */
    formatValue?: (value: number) => string;
    disabled?: boolean;
    name?: string;
    /** Vertical slider: give it a height (at least 160px) */
    orientation?: 'horizontal' | 'vertical';
    /** Marks along the track, optionally with a label: [0, 50, 100] or [{ value: 0, label: 'Off' }] */
    marks?: (number | SliderMark)[];
    /** Only the values of `marks` can be chosen (arrow keys go from mark to mark) */
    restrictToMarks?: boolean;
    /** Smallest distance between the thumbs of a range slider, in values */
    minRange?: number;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof sliderRecipe>;
}

/** A mark on the slider track */
export interface SliderMark {
    value: number;
    /** Text below the mark (beside it when vertical) */
    label?: string;
}

export function Slider({
    classes,
    value,
    defaultValue = [0],
    onValueChange,
    onValueChangeEnd,
    min = 0,
    max = 100,
    step = 1,
    label,
    thumbLabels,
    showValue = true,
    formatValue = String,
    disabled,
    name,
    orientation,
    marks,
    restrictToMarks = false,
    minRange,
    className,
    ...props
}: SliderProps) {
    const slider = useRecipe('slider', sliderRecipe, classes);
    const styles = slider({ withMarks: !!marks?.length });
    const markList = (marks ?? []).map((mark) => (typeof mark === 'number' ? { value: mark } : mark));
    // restrictToMarks: the slider is controlled here and every change snaps to a mark
    const [snapped, setSnapped] = useState(defaultValue);
    const restricted = restrictToMarks && markList.length > 0;
    const current = restricted ? (value ?? snapped) : value;
    const translations = useTranslations();
    const id = useId();
    const labelId = `${id}label`;
    const count = (value ?? defaultValue).length;

    return (
        <ArkSlider.Root
            {...props}
            className={styles.base({ class: className })}
            ids={{ label: labelId }}
            value={current}
            defaultValue={defaultValue}
            onValueChange={(details) => {
                if (!restricted) return onValueChange?.(details.value);
                const next = snapToMarks(
                    details.value,
                    current ?? defaultValue,
                    markList.map((mark) => mark.value)
                );
                setSnapped(next);
                onValueChange?.(next);
            }}
            onValueChangeEnd={(details) => onValueChangeEnd?.(details.value)}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            name={name}
            orientation={orientation}
            minStepsBetweenThumbs={minRange ? Math.ceil(minRange / step) : undefined}
            getAriaValueText={(details) => formatValue(details.value)}
        >
            <div className={styles.header()}>
                <ArkSlider.Label id={labelId} className={styles.label()}>
                    {label}
                </ArkSlider.Label>
                {showValue && (
                    <ArkSlider.Context>
                        {(api) => (
                            <span className={styles.value()} aria-hidden="true">
                                {api.value.map(formatValue).join(' – ')}
                            </span>
                        )}
                    </ArkSlider.Context>
                )}
            </div>
            <ArkSlider.Control className={styles.control()}>
                <ArkSlider.Track className={styles.track()}>
                    <ArkSlider.Range className={styles.range()} />
                </ArkSlider.Track>
                {Array.from({ length: count }, (_, index) => (
                    <ArkSlider.Thumb
                        key={index}
                        index={index}
                        className={styles.thumb()}
                        // Range: "Price, Minimum" / "Price, Maximum"
                        aria-labelledby={count > 1 ? `${labelId} ${id}thumb${index}` : labelId}
                    >
                        {count > 1 && (
                            <span id={`${id}thumb${index}`} className={styles.thumbLabel()}>
                                {(thumbLabels ?? translations.slider.thumbs)[index]}
                            </span>
                        )}
                        <ArkSlider.HiddenInput />
                    </ArkSlider.Thumb>
                ))}
                {markList.length > 0 && (
                    <ArkSlider.MarkerGroup className={styles.markerGroup()}>
                        {markList.map((mark) => (
                            <ArkSlider.Marker key={mark.value} value={mark.value} className={styles.marker()}>
                                <span className={styles.markerTick()} data-orientation={orientation ?? 'horizontal'} />
                                {mark.label}
                            </ArkSlider.Marker>
                        ))}
                    </ArkSlider.MarkerGroup>
                )}
            </ArkSlider.Control>
        </ArkSlider.Root>
    );
}
