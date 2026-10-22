import { spoiler as spoilerRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface SpoilerProps {
    /** Height of the cut content in px */
    maxHeight?: number;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    showLabel?: string;
    hideLabel?: string;
    children: ReactNode;
    className?: string;
    style?: CSSProperties;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof spoilerRecipe>;
}

/** Content cut to maxHeight; the button (aria-expanded) shows the rest. Hidden text stays in the reading order. */
export function Spoiler({
    classes,
    maxHeight = 120,
    open,
    onOpenChange,
    showLabel: showLabelProp,
    hideLabel: hideLabelProp,
    children,
    className,
    style,
}: SpoilerProps) {
    const spoiler = useRecipe('spoiler', spoilerRecipe, classes);
    const styles = spoiler();
    const translations = useTranslations();
    const showLabel = showLabelProp ?? translations.spoiler.show;
    const hideLabel = hideLabelProp ?? translations.spoiler.hide;
    const id = useId();
    const [internal, setInternal] = useState(false);
    const isOpen = open ?? internal;
    const inner = useRef<HTMLDivElement>(null);
    const [fullHeight, setFullHeight] = useState(0);
    // The button only appears when the content is taller than maxHeight
    useEffect(() => {
        const element = inner.current;
        if (!element) return;
        const measure = () => setFullHeight(element.scrollHeight);
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(element);
        return () => observer.disconnect();
    }, []);
    const cut = fullHeight > maxHeight;
    return (
        <div className={styles.base({ class: className })} style={style}>
            <div
                id={`${id}content`}
                className={styles.content()}
                data-state={cut && !isOpen ? 'closed' : 'open'}
                style={{ maxHeight: cut && !isOpen ? `${maxHeight}px` : cut ? `${fullHeight}px` : undefined }}
            >
                <div ref={inner}>{children}</div>
            </div>
            {cut && (
                <button
                    type="button"
                    className={styles.toggle()}
                    aria-expanded={isOpen}
                    aria-controls={`${id}content`}
                    onClick={() => {
                        setInternal(!isOpen);
                        onOpenChange?.(!isOpen);
                    }}
                >
                    {isOpen ? hideLabel : showLabel}
                </button>
            )}
        </div>
    );
}
