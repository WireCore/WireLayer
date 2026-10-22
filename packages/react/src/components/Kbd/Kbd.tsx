import { formatHotkey, kbd as kbdRecipe, kbdGroup, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { Fragment, type ReactNode } from 'react';
import { useIsApple } from '../../hooks/hotkeys.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface KbdProps {
    children?: ReactNode;
    /**
     * A shortcut to show key by key, e.g. "mod+k" → Ctrl K (⌘ K on Apple devices), "g i" → G then I. Without it the
     * children are the key
     */
    hotkey?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof kbdRecipe>;
}

/** A key, e.g. <Kbd>Strg</Kbd> + <Kbd>K</Kbd> – or a whole shortcut with `hotkey` */
export function Kbd({ children, hotkey, classes }: KbdProps) {
    const kbd = useRecipe('kbd', kbdRecipe, classes);
    const translations = useTranslations();
    const apple = useIsApple();
    if (!hotkey) return <kbd className={kbd()}>{children}</kbd>;
    // One key per <kbd> inside a <kbd> for the whole shortcut (HTML's way to mark up key combinations)
    return (
        <kbd className={kbdGroup()}>
            {formatHotkey(hotkey, translations.hotkeys.keys, apple).map((keys, step) => (
                <Fragment key={step}>
                    {step > 0 && ` ${translations.hotkeys.then} `}
                    {keys.map((key) => (
                        <kbd key={key} className={kbd()}>
                            {key}
                        </kbd>
                    ))}
                </Fragment>
            ))}
        </kbd>
    );
}
