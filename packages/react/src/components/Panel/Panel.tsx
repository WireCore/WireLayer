import { Collapsible } from '@ark-ui/react/collapsible';
import { panel as panelRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { ChevronRight } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface PanelProps {
    title: string;
    /** Heading level of the title */
    headingLevel?: 2 | 3 | 4;
    /** The title becomes a button that shows/hides the content */
    toggleable?: boolean;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    /** Buttons on the right of the header */
    actions?: ReactNode;
    footer?: ReactNode;
    children: ReactNode;
    className?: string;
    style?: CSSProperties;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof panelRecipe>;
}

/** Card with a heading (and actions); toggleable: the heading holds a button with aria-expanded */
export function Panel({
    classes,
    title,
    headingLevel = 3,
    toggleable = false,
    open,
    defaultOpen = true,
    onOpenChange,
    actions,
    footer,
    children,
    className,
    style,
}: PanelProps) {
    const panel = useRecipe('panel', panelRecipe, classes);
    const styles = panel();
    const Heading = `h${headingLevel}` as const;
    const body = (
        <>
            <div className={styles.body()}>{children}</div>
            {footer && <div className={styles.footer()}>{footer}</div>}
        </>
    );
    const actionBox = actions && <div className={styles.actions()}>{actions}</div>;

    if (!toggleable)
        return (
            <section className={styles.base({ class: className })} style={style}>
                <div className={styles.header()}>
                    <Heading className={styles.title()}>{title}</Heading>
                    {actionBox}
                </div>
                <div className={styles.content()}>{body}</div>
            </section>
        );
    return (
        <Collapsible.Root
            className={styles.base({ class: className })}
            style={style}
            open={open}
            defaultOpen={defaultOpen}
            onOpenChange={(details) => onOpenChange?.(details.open)}
        >
            <div className={styles.header()}>
                <Heading className={styles.title()}>
                    <Collapsible.Trigger className={styles.trigger()}>
                        <Collapsible.Indicator asChild>
                            <ChevronRight className={styles.indicator()} aria-hidden="true" />
                        </Collapsible.Indicator>
                        {title}
                    </Collapsible.Trigger>
                </Heading>
                {actionBox}
            </div>
            <Collapsible.Content className={styles.content()}>{body}</Collapsible.Content>
        </Collapsible.Root>
    );
}
