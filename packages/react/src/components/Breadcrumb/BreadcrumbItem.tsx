import { ark } from '@ark-ui/react/factory';
import { breadcrumb as breadcrumbRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { ChevronRight } from 'lucide-react';
import type { ComponentProps } from 'react';
import type { IconComponent } from '../../types.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface BreadcrumbItemProps extends ComponentProps<'a'> {
    href?: string;
    /** The current page – sets aria-current="page" */
    current?: boolean;
    /** Icon component before the label */
    icon?: IconComponent;
    /** Show only the icon; the label stays available to screen readers */
    iconOnly?: boolean;
    /** Render the child link (e.g. Next.js Link) with breadcrumb styles */
    asChild?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof breadcrumbRecipe>;
}

/** One step of a Breadcrumb (link, or the current page) */
export function BreadcrumbItem({
    classes,
    href,
    current = false,
    icon: Icon,
    iconOnly = false,
    asChild = false,
    className,
    style,
    children,
    ...props
}: BreadcrumbItemProps) {
    const breadcrumb = useRecipe('breadcrumb', breadcrumbRecipe, classes);
    const styles = breadcrumb({ current });
    const content = (
        <>
            {Icon && <Icon className={styles.icon()} aria-hidden="true" />}
            {iconOnly ? <span className={styles.hiddenLabel()}>{children}</span> : children}
        </>
    );

    return (
        <li className={styles.item({ class: className })} style={style}>
            <ChevronRight className={styles.separator()} aria-hidden="true" />
            {href || asChild ? (
                <ark.a
                    {...props}
                    href={asChild ? undefined : href}
                    asChild={asChild}
                    aria-current={current ? 'page' : undefined}
                    className={styles.link()}
                >
                    {asChild ? children : content}
                </ark.a>
            ) : (
                <span
                    {...(props as ComponentProps<'span'>)}
                    aria-current={current ? 'page' : undefined}
                    className={styles.text()}
                >
                    {content}
                </span>
            )}
        </li>
    );
}
