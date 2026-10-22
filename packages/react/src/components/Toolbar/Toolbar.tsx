import {
    setupToolbar,
    toolbar as toolbarRecipe,
    toolbarRegion as toolbarRegionRecipe,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface ToolbarProps {
    /** Accessible name, e.g. "Formatting" */
    label: string;
    orientation?: 'horizontal' | 'vertical';
    children?: ReactNode;
    /** Start area (before the children) – with start, center or end the toolbar has three areas */
    start?: ReactNode;
    /** Centre area, stays in the middle */
    center?: ReactNode;
    /** End area */
    end?: ReactNode;
    className?: string;
    style?: CSSProperties;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof toolbarRecipe>;
}

/** Groups controls (role="toolbar"): one tab stop, arrow keys move between the controls (across all areas) */
export function Toolbar({
    classes,
    label,
    orientation = 'horizontal',
    children,
    start,
    center,
    end,
    className,
    style,
}: ToolbarProps) {
    const toolbar = useRecipe('toolbar', toolbarRecipe, classes);
    const toolbarRegion = useRecipe('toolbarRegion', toolbarRegionRecipe);
    const element = useRef<HTMLDivElement>(null);
    useEffect(() => setupToolbar(element.current!, orientation), [orientation]);
    const regions = !!(start || center || end);
    return (
        <div
            ref={element}
            role="toolbar"
            aria-label={label}
            aria-orientation={orientation}
            className={toolbar({ regions: regions || undefined, class: className })}
            style={style}
        >
            {regions ? (
                <>
                    <div className={toolbarRegion({ region: 'start' })}>
                        {start}
                        {children}
                    </div>
                    <div className={toolbarRegion({ region: 'center' })}>{center}</div>
                    <div className={toolbarRegion({ region: 'end' })}>{end}</div>
                </>
            ) : (
                children
            )}
        </div>
    );
}
