import { isTruncated, truncate as truncateRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { useCallback, useEffect, useId, useState, type CSSProperties, type HTMLAttributes } from 'react';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';
import { Tooltip } from '../Tooltip/Tooltip.js';

export interface TruncateProps extends HTMLAttributes<HTMLElement> {
    /** The text */
    text: string;
    /** Lines before the text is cut (default 1: one line with an ellipsis) */
    lines?: number;
    /** The full text in a tooltip – only while it is cut; the text then becomes focusable for keyboard users */
    tooltip?: boolean;
    /** A "Show more" button below the cut text instead of the tooltip */
    expandable?: boolean;
    /** Expanded state with `expandable` (controlled) */
    expanded?: boolean;
    defaultExpanded?: boolean;
    onExpandedChange?: (expanded: boolean) => void;
    /** Element of the text (default span; p for paragraphs) */
    as?: 'span' | 'p' | 'div';
    /** Text of the button while cut / expanded */
    moreLabel?: string;
    lessLabel?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof truncateRecipe>;
}

/** Text cut to one or more lines; the full text in a tooltip (only while cut) or behind a "Show more" button */
export function Truncate({
    classes,
    text,
    lines = 1,
    tooltip = true,
    expandable = false,
    expanded,
    defaultExpanded = false,
    onExpandedChange,
    as: Element = 'span',
    moreLabel,
    lessLabel,
    className,
    style,
    ...props
}: TruncateProps) {
    const truncate = useRecipe('truncate', truncateRecipe, classes);
    const translations = useTranslations();
    const id = useId();
    const [internal, setInternal] = useState(defaultExpanded);
    const isExpanded = expandable && (expanded ?? internal);
    const [element, setElement] = useState<HTMLElement | null>(null);
    // Measured in the browser: the server renders the text without tooltip or button
    const [cut, setCut] = useState(false);
    const measure = useCallback(() => {
        if (!isExpanded) setCut(isTruncated(element));
    }, [element, isExpanded]);
    useEffect(() => {
        if (!element) return;
        const frame = requestAnimationFrame(measure);
        if (typeof ResizeObserver === 'undefined') return () => cancelAnimationFrame(frame);
        const observer = new ResizeObserver(measure);
        observer.observe(element);
        return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
        };
    }, [element, measure, text, lines]);
    const styles = truncate({
        clamp: isExpanded ? 'all' : lines > 1 ? 'many' : 'one',
        focusable: !expandable && tooltip && cut,
    });
    const lineStyle = lines > 1 ? ({ ...style, '--wc-lines': String(lines) } as CSSProperties) : style;

    if (expandable) {
        const toggle = () => {
            setInternal(!isExpanded);
            onExpandedChange?.(!isExpanded);
        };
        return (
            <div {...props} className={styles.base({ class: className })} style={style}>
                <Element
                    id={`${id}text`}
                    ref={setElement}
                    className={styles.text()}
                    style={lines > 1 ? ({ '--wc-lines': String(lines) } as CSSProperties) : undefined}
                >
                    {text}
                </Element>
                {(cut || isExpanded) && (
                    <button
                        type="button"
                        className={styles.toggle()}
                        aria-expanded={isExpanded}
                        aria-controls={`${id}text`}
                        onClick={toggle}
                    >
                        {isExpanded
                            ? (lessLabel ?? translations.truncate.less)
                            : (moreLabel ?? translations.truncate.more)}
                    </button>
                )}
            </div>
        );
    }
    const content = (
        <Element
            {...props}
            ref={setElement}
            className={styles.text({ class: [styles.base(), className] })}
            style={lineStyle}
            tabIndex={tooltip && cut ? 0 : undefined}
        >
            {text}
        </Element>
    );
    // While cut, the full text is the tooltip of the text (which is then focusable)
    return tooltip ? (
        <Tooltip content={text} disabled={!cut}>
            {content}
        </Tooltip>
    ) : (
        content
    );
}
