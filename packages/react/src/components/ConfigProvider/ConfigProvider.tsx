import {
    configProvider as configProviderRecipe,
    sizeOverrides,
    type RecipeClasses,
    type RecipeConfig,
    type Translations,
} from '@wirecore/wirelayer-recipes';
import { useMemo, type ComponentProps, type ReactNode } from 'react';
import { LocaleProvider } from '../LocaleProvider/LocaleProvider.js';
import { RecipesProvider, useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface ConfigProviderProps extends ComponentProps<'div'> {
    /** Language and formats of the part below (LocaleProvider) – e.g. "en-US" */
    locale?: string;
    /** Texts of a language without built-in translations */
    translations?: Translations;
    /** Defaults and classes per recipe (RecipesProvider) */
    recipes?: RecipeConfig;
    /**
     * Default size (density) of every component that has it – buttons, inputs, selects … – unless a component sets its
     * own; `recipes` win over it
     */
    size?: 'xs' | 'sm' | 'md' | 'lg';
    /** Colour theme of the part below (`data-theme`, e.g. "ocean") */
    theme?: string;
    /** Light or dark for the part below (`data-mode`) */
    mode?: 'light' | 'dark';
    /** Writing direction of the part below */
    dir?: 'ltr' | 'rtl';
    children?: ReactNode;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof configProviderRecipe>;
}

/** Locale, recipe defaults, size and theme for a part of the page – one wrapper instead of several providers */
export function ConfigProvider({
    classes,
    locale,
    translations,
    recipes,
    size,
    theme,
    mode,
    dir,
    className,
    children,
    ...props
}: ConfigProviderProps) {
    const configProvider = useRecipe('configProvider', configProviderRecipe, classes);
    const merged = useMemo(() => {
        const sized = size ? sizeOverrides(size) : {};
        // The size first, own recipes over it (RecipesProvider joins them per recipe)
        const result: Record<string, unknown> = { ...sized };
        for (const [name, override] of Object.entries(recipes ?? {}))
            result[name] = sized[name]
                ? {
                      defaultVariants: { ...sized[name].defaultVariants, ...override?.defaultVariants },
                      classes: override?.classes,
                  }
                : override;
        return result as RecipeConfig;
    }, [size, recipes]);
    let content = <RecipesProvider recipes={merged}>{children}</RecipesProvider>;
    if (locale || translations)
        content = (
            <LocaleProvider locale={locale} translations={translations}>
                {content}
            </LocaleProvider>
        );
    // An element of its own only when theme, mode or direction apply to the part below
    if (!theme && !mode && !dir) return content;
    return (
        <div {...props} className={configProvider({ class: className })} data-theme={theme} data-mode={mode} dir={dir}>
            {content}
        </div>
    );
}
