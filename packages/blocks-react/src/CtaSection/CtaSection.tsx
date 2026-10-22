import { ctaSection as ctaSectionRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { useId, type ComponentProps } from 'react';
import { useRecipe } from '@wirecore/wirelayer-react';

export interface CtaSectionProps extends Omit<ComponentProps<'section'>, 'title'> {
    title: string;
    description?: string;
    /** Decorative background image (e.g. the logo), shown faintly on the right */
    image?: string;
    /** Heading level that fits the page outline */
    titleTag?: 'h2' | 'h3' | 'h4';
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof ctaSectionRecipe>;
}

/** A named region: the title labels it. Children are the actions. */
export function CtaSection({
    classes,
    title,
    description,
    image,
    titleTag: Title = 'h2',
    className,
    children,
    ...props
}: CtaSectionProps) {
    const ctaSection = useRecipe('ctaSection', ctaSectionRecipe, classes);
    const styles = ctaSection();
    const titleId = useId();

    return (
        <section {...props} className={styles.base({ class: className })} aria-labelledby={titleId}>
            {image && <img src={image} alt="" className={styles.image()} />}
            <Title id={titleId} className={styles.title()}>
                {title}
            </Title>
            {description && <p className={styles.description()}>{description}</p>}
            {children && <div className={styles.actions()}>{children}</div>}
        </section>
    );
}
