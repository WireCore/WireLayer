import { countdown as countdownRecipe, countdownParts, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { Fragment, useEffect, useSyncExternalStore, type ComponentProps } from 'react';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export type CountdownUnit = 'days' | 'hours' | 'minutes' | 'seconds';

export interface CountdownProps extends Omit<ComponentProps<'div'>, 'children'> {
    /** End point: ISO string ("2026-12-24T18:00"), timestamp or Date */
    target: string | number | Date;
    /** Accessible name of the timer, e.g. "Offer ends in" */
    label: string;
    /** Shown units, largest first – the largest takes everything above it (e.g. 49 hours without days) */
    units?: readonly CountdownUnit[];
    variant?: 'boxed' | 'plain';
    size?: 'sm' | 'md' | 'lg';
    /** `units` (default): each value above its unit; `clock`: "05:12:33", the units for screen readers only */
    format?: 'units' | 'clock';
    /** The target time was reached */
    onComplete?: () => void;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof countdownRecipe>;
}

const allUnits: CountdownUnit[] = ['days', 'hours', 'minutes', 'seconds'];

// One clock in whole seconds for all countdowns; the server (and hydration) has none, so both show "--"
const subscribe = (tick: () => void) => {
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
};
const currentSecond = () => Math.floor(Date.now() / 1000) * 1000;
const noTime = () => null;

/** role="timer": screen readers read the current value on demand, without announcing every second */
export function Countdown({
    classes,
    target,
    label,
    units = allUnits,
    variant,
    size,
    format,
    onComplete,
    className,
    ...props
}: CountdownProps) {
    const countdown = useRecipe('countdown', countdownRecipe, classes);
    const translations = useTranslations();
    const styles = countdown({ variant, size, format });
    const now = useSyncExternalStore(subscribe, currentSecond, noTime);
    const remaining = now === null ? null : new Date(target).getTime() - now;
    const parts = remaining === null ? null : countdownParts(remaining, units);
    const done = remaining !== null && remaining <= 0;
    useEffect(() => {
        if (done) onComplete?.();
        // Only when the end is reached, not for a new callback
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [done]);

    return (
        <div
            {...props}
            className={styles.base({ class: className })}
            role="timer"
            aria-label={label}
            aria-atomic="true"
        >
            {allUnits
                .filter((unit) => units.includes(unit))
                .map((unit, index) => (
                    <Fragment key={unit}>
                        {format === 'clock' && index > 0 && (
                            <span className={styles.separator()} aria-hidden="true">
                                :
                            </span>
                        )}
                        <span className={styles.unit()}>
                            <span className={styles.value()}>
                                {parts ? String(parts[unit]).padStart(2, '0') : '--'}
                            </span>
                            {/* A clock reads "05 hours": the space keeps the hidden unit apart from the value */}
                            <span className={styles.label()}>
                                {format === 'clock' ? ' ' : ''}
                                {translations.countdown[unit](parts ? parts[unit] : 0)}
                            </span>
                        </span>
                    </Fragment>
                ))}
        </div>
    );
}
