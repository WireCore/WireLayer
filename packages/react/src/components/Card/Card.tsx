import { ark } from '@ark-ui/react/factory';
import { card as cardRecipe, cardParts as cardPartsRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import type { ComponentProps, ReactNode } from 'react';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface CardProps extends Omit<ComponentProps<'div'>, 'title'> {
    /**
     * Hover state and glow, for cards that act as a link or button.
     * Combine with `asChild` and an `<a>`/`<button>` – a clickable `<div>` is not keyboard accessible.
     */
    interactive?: boolean;
    /** Render the child element (e.g. a link) with card styles instead of a <div> (the parts are not rendered) */
    asChild?: boolean;
    /** Heading of the card */
    title?: ReactNode;
    /** Line below the title */
    subtitle?: ReactNode;
    /** Element of the title – pick the level that fits the page outline */
    titleTag?: 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p';
    /** `horizontal`: media at the start, the content beside it */
    orientation?: 'vertical' | 'horizontal';
    /** `sm`: smaller radius, padding and title, e.g. for cards in a list inside a dialog */
    size?: 'sm' | 'md';
    /** Image or video above the content (beside it when horizontal) */
    media?: ReactNode;
    /** Extra content in the header, after the title (e.g. a badge or a menu) */
    header?: ReactNode;
    /** Actions at the end of the card */
    footer?: ReactNode;
    /** Extra classes per part of the component, e.g. { base: "…", title: "…" } (see the recipes card and cardParts) */
    classes?: RecipeClasses<typeof cardRecipe> & RecipeClasses<typeof cardPartsRecipe>;
}

/** Surface for grouped content, optionally with title, media and footer; interactive cards with asChild */
export function Card({
    classes,
    interactive = false,
    asChild = false,
    title,
    subtitle,
    titleTag: TitleTag = 'h3',
    orientation = 'vertical',
    size,
    media,
    header,
    footer,
    className,
    children,
    ...props
}: CardProps) {
    const card = useRecipe('card', cardRecipe, classes);
    const cardParts = useRecipe('cardParts', cardPartsRecipe, classes);
    const horizontal = orientation === 'horizontal';
    const base = card({ interactive, horizontal: horizontal || undefined, size, class: className });
    const hasTitle = !!title || !!subtitle;
    // Without title, media, header or footer the card renders its content as before
    if (asChild || !(hasTitle || media || header || footer)) {
        return (
            <ark.div {...props} className={base} asChild={asChild}>
                {children}
            </ark.div>
        );
    }
    const parts = cardParts({ horizontal, size });
    return (
        <div {...props} className={base}>
            {media && <div className={parts.media()}>{media}</div>}
            <div className={parts.content()}>
                {(hasTitle || header) && (
                    <div className={parts.header()}>
                        {hasTitle && (
                            <div className={parts.heading()}>
                                {title && <TitleTag className={parts.title()}>{title}</TitleTag>}
                                {subtitle && <p className={parts.subtitle()}>{subtitle}</p>}
                            </div>
                        )}
                        {header}
                    </div>
                )}
                {children}
                {footer && <div className={parts.footer()}>{footer}</div>}
            </div>
        </div>
    );
}
