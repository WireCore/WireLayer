import { compare as compareRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { ChevronsLeftRight } from 'lucide-react';
import { useState, type ComponentProps } from 'react';
import { useLocale, useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface CompareImage {
    src: string;
    alt: string;
}

export interface CompareProps extends Omit<ComponentProps<'div'>, 'children' | 'defaultValue' | 'onChange'> {
    /** Shown on the start side (left, right-to-left: right) */
    before: CompareImage;
    after: CompareImage;
    /** Accessible name of the slider */
    label?: string;
    beforeLabel?: string;
    afterLabel?: string;
    /** Share of the before image in percent */
    value?: number;
    defaultValue?: number;
    onValueChange?: (value: number) => void;
    /** Aspect ratio of the area (CSS) */
    aspectRatio?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof compareRecipe>;
}

/** Two images on top of each other; the range input over them moves the line (drag, click, arrow keys) */
export function Compare({
    before,
    after,
    label,
    beforeLabel,
    afterLabel,
    value: valueProp,
    defaultValue = 50,
    onValueChange,
    aspectRatio = '16 / 9',
    classes,
    className,
    style,
    ...props
}: CompareProps) {
    const styles = useRecipe('compare', compareRecipe, classes)();
    const { dir } = useLocale();
    const t = useTranslations().compare;
    const [internal, setInternal] = useState(defaultValue);
    const value = valueProp ?? internal;
    // The before image is cut off on the end side
    const clipPath = dir === 'rtl' ? `inset(0 0 0 ${100 - value}%)` : `inset(0 ${100 - value}% 0 0)`;
    return (
        <div {...props} className={styles.base({ class: className })} style={{ aspectRatio, ...style }}>
            <img className={styles.image()} src={after.src} alt={after.alt} />
            <img className={styles.image()} src={before.src} alt={before.alt} style={{ clipPath }} />
            <span className={styles.label({ class: styles.beforeLabel() })} aria-hidden="true">
                {beforeLabel ?? t.before}
            </span>
            <span className={styles.label({ class: styles.afterLabel() })} aria-hidden="true">
                {afterLabel ?? t.after}
            </span>
            <span className={styles.divider()} style={{ insetInlineStart: `${value}%` }}>
                <span className={styles.handle()}>
                    <ChevronsLeftRight className={styles.handleIcon()} aria-hidden="true" />
                </span>
            </span>
            <input
                className={styles.input()}
                type="range"
                min="0"
                max="100"
                step="1"
                value={value}
                aria-label={label ?? t.label}
                aria-valuetext={t.valueText(value)}
                onChange={(event) => {
                    const next = Number(event.target.value);
                    setInternal(next);
                    onValueChange?.(next);
                }}
            />
        </div>
    );
}
