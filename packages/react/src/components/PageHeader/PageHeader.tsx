import { pageHeader as pageHeaderRecipe, type BadgeVariant, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { ArrowLeft } from 'lucide-react';
import type { ComponentProps, MouseEvent, ReactNode } from 'react';
import { Badge } from '../Badge/Badge.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface PageHeaderProps extends Omit<ComponentProps<'div'>, 'title'> {
    title: string;
    /** Level of the title (default 1 – the heading of the page) */
    headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
    /** Line below the title */
    subtitle?: string;
    /** Back link above the title, e.g. to the list */
    backHref?: string;
    /** Text of the back link (default "Back") */
    backLabel?: string;
    /** The back link was clicked – call event.preventDefault() and route yourself in a single-page app */
    onBack?: (event: MouseEvent<HTMLAnchorElement>) => void;
    /** Status next to the title as a badge, e.g. "Draft" */
    status?: string;
    statusVariant?: BadgeVariant;
    /** sm: smaller title, e.g. inside a dialog or panel */
    size?: 'sm' | 'md';
    /** A line below the header */
    divided?: boolean;
    /** Breadcrumb above everything */
    breadcrumb?: ReactNode;
    /** Meta information below the title (dates, owner …) */
    meta?: ReactNode;
    /** Buttons at the end; they wrap below the title on narrow screens */
    actions?: ReactNode;
    /** Tabs below the header */
    tabs?: ReactNode;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof pageHeaderRecipe>;
}

/** Top of a page: breadcrumb, back link, title (heading) with status, subtitle and meta, actions, tabs */
export function PageHeader({
    classes,
    title,
    headingLevel = 1,
    subtitle,
    backHref,
    backLabel,
    onBack,
    status,
    statusVariant,
    size,
    divided,
    breadcrumb,
    meta,
    actions,
    tabs,
    className,
    ...props
}: PageHeaderProps) {
    const pageHeader = useRecipe('pageHeader', pageHeaderRecipe, classes);
    const styles = pageHeader({ size, divided });
    const translations = useTranslations();
    const Heading = `h${headingLevel}` as const;
    return (
        <div {...props} className={styles.base({ class: className })}>
            {breadcrumb}
            {backHref && (
                <a href={backHref} className={styles.back()} onClick={onBack}>
                    <ArrowLeft className={styles.backIcon()} aria-hidden="true" />
                    {backLabel ?? translations.pageHeader.back}
                </a>
            )}
            <div className={styles.row()}>
                <div className={styles.heading()}>
                    <div className={styles.titleRow()}>
                        <Heading className={styles.title()}>{title}</Heading>
                        {status && <Badge variant={statusVariant}>{status}</Badge>}
                    </div>
                    {subtitle && <p className={styles.subtitle()}>{subtitle}</p>}
                    {meta && <div className={styles.meta()}>{meta}</div>}
                </div>
                {actions && <div className={styles.actions()}>{actions}</div>}
            </div>
            {tabs && <div className={styles.tabs()}>{tabs}</div>}
        </div>
    );
}
