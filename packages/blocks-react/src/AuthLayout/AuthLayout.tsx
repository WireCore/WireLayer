import { authLayout as authLayoutRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { useRecipe } from '@wirecore/wirelayer-react';
import type { ComponentProps, ReactNode } from 'react';

export interface AuthLayoutProps extends ComponentProps<'div'> {
    /** Decorative image on the other side (hidden on small screens) */
    image?: string;
    /** Form on the start (default) or end side */
    side?: 'start' | 'end';
    /** Logo or product name above the form */
    brand?: ReactNode;
    /** Text over the image: quote, product promise … */
    teaser?: ReactNode;
    /** Below the form: imprint, privacy */
    footer?: ReactNode;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof authLayoutRecipe>;
}

/** Two columns: the form in <main>, the image with a teaser as a complementary area (stacked on small screens) */
export function AuthLayout({
    image,
    side = 'start',
    brand,
    teaser,
    footer,
    classes,
    className,
    children,
    ...props
}: AuthLayoutProps) {
    const authLayout = useRecipe('authLayout', authLayoutRecipe, classes);
    const styles = authLayout({ side });
    return (
        <div {...props} className={styles.base({ class: className })}>
            <main className={styles.main()}>
                {brand && <div className={styles.brand()}>{brand}</div>}
                <div className={styles.content()}>{children}</div>
                {footer && <div className={styles.footer()}>{footer}</div>}
            </main>
            {(image || teaser) && (
                <aside className={styles.aside()}>
                    {image && (
                        <>
                            <img src={image} alt="" className={styles.image()} />
                            <div className={styles.scrim()} aria-hidden="true" />
                        </>
                    )}
                    {teaser && <div className={styles.teaser()}>{teaser}</div>}
                </aside>
            )}
        </div>
    );
}
