import { actionBar as actionBarRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { X } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { IconButton } from '../IconButton/IconButton.js';
import { Toolbar } from '../Toolbar/Toolbar.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface ActionBarProps {
    /** Number of selected items – the bar shows while it is above 0 */
    count: number;
    /** Shows the bar independently of `count` */
    open?: boolean;
    /** Accessible name of the toolbar */
    label?: string;
    /** Name of the button that clears the selection */
    clearLabel?: string;
    /** `fixed` floats at the bottom of the window, `inline` stays in the flow */
    placement?: 'fixed' | 'inline';
    /** The clear button was pressed */
    onClear?: () => void;
    children?: ReactNode;
    className?: string;
    style?: CSSProperties;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof actionBarRecipe>;
}

/** Actions for the selected items: a toolbar (one tab stop, arrow keys) with the count and a clear button */
export function ActionBar({
    classes,
    count,
    open,
    label,
    clearLabel,
    placement,
    onClear,
    children,
    className,
    style,
}: ActionBarProps) {
    const actionBar = useRecipe('actionBar', actionBarRecipe, classes);
    const translations = useTranslations();
    const styles = actionBar({ placement });
    if (!(open ?? count > 0)) return null;
    return (
        <Toolbar
            label={label ?? translations.actionBar.label}
            className={styles.base({ class: className })}
            style={style}
        >
            <span role="status" className={styles.count()}>
                {translations.common.selectedCount(count)}
            </span>
            {children}
            <span className={styles.separator()} aria-hidden="true" />
            <IconButton
                icon={X}
                label={clearLabel ?? translations.actionBar.clear}
                variant="text"
                size="sm"
                onClick={onClear}
            />
        </Toolbar>
    );
}
