import { Progress as ArkProgress } from '@ark-ui/react/progress';
import { progress as progressRecipe, type MeterColor, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import type { ComponentProps } from 'react';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface ProgressSegment {
    value: number;
    /** Name in the legend */
    label?: string;
    color?: MeterColor;
    /** Tooltip of the part (pointer only – the legend carries the text) */
    tooltip?: string;
}

export interface ProgressProps extends Omit<ComponentProps<'div'>, 'defaultValue' | 'dir'> {
    value: number;
    max?: number;
    /** Visible label, also the accessible name of the progress bar */
    label?: string;
    /** Show the value next to the label */
    showValue?: boolean;
    /** Formats the value text (shown and announced) */
    valueText?: (percent: number) => string;
    /** Several parts in one bar (their sum is the value); a legend names them */
    segments?: readonly ProgressSegment[];
    /** Shows the progress as this many blocks (e.g. steps of a wizard) */
    steps?: number;
    /** Diagonal stripes on the filled part */
    striped?: boolean;
    /** Moving stripes (only without reduced motion) */
    animated?: boolean;
    /** Vertical bar (fills the height of its parent) */
    orientation?: 'horizontal' | 'vertical';
    /** `xs`: a thin bar with small text, e.g. in a list or a status bar */
    size?: 'xs' | 'md';
    /** Colour of the filled part by its state, e.g. `danger` for a failed transfer */
    status?: 'info' | 'success' | 'warn' | 'danger';
    /** The label only for screen readers – it still names the progress bar */
    hideLabel?: boolean;
    /**
     * Short text in the bar, e.g. "42 %", "waiting" or "failed" (a taller bar; horizontal, without segments or steps)
     * – screen readers get it after the value
     */
    barText?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof progressRecipe>;
}

const palette: MeterColor[] = ['primary', 'info', 'success', 'warn', 'danger', 'muted'];

export function Progress({
    classes,
    value,
    max = 100,
    label,
    showValue = true,
    valueText = (percent) => `${percent} %`,
    segments,
    steps,
    striped,
    animated,
    orientation = 'horizontal',
    size,
    status,
    hideLabel = false,
    barText,
    className,
    'aria-label': ariaLabel,
    ...props
}: ProgressProps) {
    const progress = useRecipe('progress', progressRecipe, classes);
    const total = segments ? segments.reduce((sum, segment) => sum + Math.max(0, segment.value), 0) : value;
    const showBarText = !!barText && !segments?.length && !steps && orientation !== 'vertical';
    const styles = progress({
        orientation,
        striped,
        animated,
        stepped: !!steps && !segments,
        size,
        color: status,
        hideLabel,
        hasText: showBarText,
    });
    const percentOf = (part: number) => Math.round((part / max) * 100);
    const text = valueText(percentOf(total));
    const announced = showBarText && barText !== text ? `${text}, ${barText}` : text;
    const filled = steps ? Math.round((total / max) * steps) : 0;
    const sizeKey = orientation === 'vertical' ? 'height' : 'width';
    const colorOf = (segment: ProgressSegment, index: number) => segment.color ?? palette[index % palette.length]!;

    return (
        <ArkProgress.Root
            {...props}
            className={styles.base({ class: className })}
            value={total}
            max={max}
            {...(orientation === 'vertical' ? { orientation } : {})}
        >
            {((label && !hideLabel) || showValue) && (
                <div className={styles.header()}>
                    {label && !hideLabel && <ArkProgress.Label className={styles.label()}>{label}</ArkProgress.Label>}
                    {showValue && <ArkProgress.ValueText className={styles.value()}>{text}</ArkProgress.ValueText>}
                </div>
            )}
            {/* Ark names the progressbar after its value; the label is the name, the value its valuetext */}
            <ArkProgress.Track className={styles.track()} aria-label={label ?? ariaLabel} aria-valuetext={announced}>
                {showBarText && (
                    <span className={styles.barText()} aria-hidden="true">
                        {barText}
                    </span>
                )}
                {segments?.length ? (
                    <div className={styles.segments()}>
                        {segments.map((segment, index) => (
                            <span
                                key={segment.label ?? index}
                                className={progress({ color: colorOf(segment, index), striped, animated }).segment()}
                                style={{ [sizeKey]: `${(Math.max(0, segment.value) / max) * 100}%` }}
                                title={segment.tooltip ?? segment.label}
                            />
                        ))}
                    </div>
                ) : steps ? (
                    <div className={styles.steps()}>
                        {Array.from({ length: steps }, (_, index) => (
                            <span
                                key={index + 1}
                                className={styles.step()}
                                data-state={index + 1 <= filled ? 'complete' : undefined}
                            />
                        ))}
                    </div>
                ) : (
                    <ArkProgress.Range className={styles.range()}>
                        {showBarText && (
                            <span className={styles.barTextFill()} aria-hidden="true">
                                {barText}
                            </span>
                        )}
                    </ArkProgress.Range>
                )}
            </ArkProgress.Track>
            {segments?.some((segment) => segment.label) && (
                <ul className={styles.legend()}>
                    {segments.map((segment, index) => (
                        <li key={segment.label ?? index} className={styles.legendItem()}>
                            <span
                                className={progress({ color: colorOf(segment, index) }).swatch()}
                                aria-hidden="true"
                            />
                            {`${segment.label ?? ''} `}
                            <span className={styles.legendValue()}>{valueText(percentOf(segment.value))}</span>
                        </li>
                    ))}
                </ul>
            )}
        </ArkProgress.Root>
    );
}
