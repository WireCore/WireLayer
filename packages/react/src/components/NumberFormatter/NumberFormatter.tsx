import { numberFormatter as numberFormatterRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import type { ComponentProps } from 'react';
import { useLocale } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface NumberFormatterProps extends Omit<ComponentProps<'span'>, 'children'> {
    value: number | bigint | null | undefined;
    /** Format, e.g. { style: 'currency', currency: 'EUR' } or { notation: 'compact' } */
    formatOptions?: Intl.NumberFormatOptions;
    locale?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof numberFormatterRecipe>;
}

/** A number in the format of the locale ("€1,234.50") */
export function NumberFormatter({ classes, value, formatOptions, locale, className, ...props }: NumberFormatterProps) {
    const numberFormatter = useRecipe('numberFormatter', numberFormatterRecipe, classes);
    const localeContext = useLocale();
    const text =
        value === null || value === undefined
            ? ''
            : new Intl.NumberFormat(locale ?? localeContext.locale, formatOptions).format(value);
    return (
        <span {...props} className={numberFormatter({ class: className })}>
            {text}
        </span>
    );
}
