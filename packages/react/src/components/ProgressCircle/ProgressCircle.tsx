import { Progress } from '@ark-ui/react/progress';
import { progressCircle as progressCircleRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import type { CSSProperties } from 'react';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface ProgressCircleProps {
    value: number;
    max?: number;
    /** Visible label below the ring, also its accessible name */
    label: string;
    size?: 'sm' | 'md' | 'lg';
    status?: 'neutral' | 'success' | 'warn' | 'danger';
    /** Text in the ring (default: percent) */
    formatValue?: (value: number, max: number) => string;
    className?: string;
    style?: CSSProperties;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof progressCircleRecipe>;
}

const percent = (value: number, max: number) => `${Math.round((value / max) * 100)} %`;

/** Ring with the value in the middle; a progressbar named by its label, the value as aria-valuetext */
export function ProgressCircle({
    classes,
    value,
    max = 100,
    label,
    size = 'md',
    status = 'neutral',
    formatValue = percent,
    className,
    style,
}: ProgressCircleProps) {
    const progressCircle = useRecipe('progressCircle', progressCircleRecipe, classes);
    const styles = progressCircle({ size, status });
    const text = formatValue(value, max);
    return (
        <Progress.Root
            className={styles.base({ class: className })}
            style={style}
            value={value}
            max={max}
            translations={{ value: () => text }}
        >
            <div className={styles.circle()}>
                {/* zag names the ring by its value only – the label is the name, the value the value text */}
                <Progress.Circle aria-label={label} aria-valuetext={text}>
                    <Progress.CircleTrack className={styles.track()} />
                    <Progress.CircleRange className={styles.range()} />
                </Progress.Circle>
                <span className={styles.value()} aria-hidden="true">
                    {text}
                </span>
            </div>
            <Progress.Label className={styles.label()}>{label}</Progress.Label>
        </Progress.Root>
    );
}
