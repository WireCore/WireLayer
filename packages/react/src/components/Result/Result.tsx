import { result as resultRecipe, type RecipeClasses, type ResultStatus } from '@wirecore/wirelayer-recipes';
import { CircleCheck, CircleX, Info, SearchX, ServerCrash, ShieldX, TriangleAlert } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import type { IconComponent } from '../../types.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface ResultProps extends Omit<ComponentProps<'div'>, 'title'> {
    /** success, info (default), warn, error, or the HTTP errors 403, 404, 500 (with the code above the title) */
    status?: ResultStatus;
    /** Default per status, e.g. "Page not found" */
    title?: string;
    /** Text below the title; 403, 404 and 500 have one by default */
    description?: string;
    /** Own icon for the illustration */
    icon?: IconComponent;
    /** Level of the title (default 2; 1 when the result is the whole page) */
    headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
    /** Buttons below the text, e.g. "Go to home page" */
    actions?: ReactNode;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof resultRecipe>;
}

const icons: Record<ResultStatus, IconComponent> = {
    success: CircleCheck,
    info: Info,
    warn: TriangleAlert,
    error: CircleX,
    '403': ShieldX,
    '404': SearchX,
    '500': ServerCrash,
};

/** Result or error page: illustration (decorative icon), optional status code, title (heading), text, actions */
export function Result({
    classes,
    status = 'info',
    title,
    description,
    icon,
    headingLevel = 2,
    actions,
    className,
    children,
    ...props
}: ResultProps) {
    const result = useRecipe('result', resultRecipe, classes);
    const styles = result({ status });
    const texts = useTranslations().result;
    const fallback: Record<string, string> = {
        '403': texts.description403,
        '404': texts.description404,
        '500': texts.description500,
    };
    const text = description ?? fallback[status];
    const Icon = icon ?? icons[status];
    const Heading = `h${headingLevel}` as const;
    return (
        <div {...props} className={styles.base({ class: className })}>
            <div className={styles.illustration()} aria-hidden="true">
                <Icon className={styles.icon()} />
            </div>
            {/^\d+$/.test(status) && <p className={styles.code()}>{status}</p>}
            <Heading className={styles.title()}>{title ?? texts[status]}</Heading>
            {text && <p className={styles.description()}>{text}</p>}
            {children && <div className={styles.extra()}>{children}</div>}
            {actions && <div className={styles.actions()}>{actions}</div>}
        </div>
    );
}
