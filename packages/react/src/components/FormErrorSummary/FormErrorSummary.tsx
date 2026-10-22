import {
    focusFormControl,
    formErrorSummary as formErrorSummaryRecipe,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { CircleAlert } from 'lucide-react';
import { useEffect, useId, useRef, type ComponentProps } from 'react';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface FormErrorSummaryItem {
    /** Error text, e.g. "Please enter a valid email address" */
    message: string;
    /** Id of the field's control (e.g. Field `id`) – the message links to it and focuses it */
    id?: string;
}

export interface FormErrorSummaryProps extends Omit<ComponentProps<'div'>, 'title'> {
    /** The current errors; nothing is rendered without any */
    errors: FormErrorSummaryItem[];
    /** Heading (default "Please correct 2 entries") */
    title?: string;
    /** Element of the heading – pick the level that fits the page outline */
    titleTag?: 'h2' | 'h3' | 'h4' | 'p';
    /** Moves the focus to the summary when errors appear (WCAG 3.3.1) */
    autoFocus?: boolean;
    /** Focuses the summary again whenever this changes while there are errors, e.g. the number of submit attempts */
    focusKey?: unknown;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof formErrorSummaryRecipe>;
}

/** List of the form's errors with links to the fields; takes the focus after submitting (WCAG 3.3.1) */
export function FormErrorSummary({
    classes,
    errors,
    title,
    titleTag: TitleTag = 'h2',
    autoFocus = true,
    focusKey,
    className,
    ...props
}: FormErrorSummaryProps) {
    const formErrorSummary = useRecipe('formErrorSummary', formErrorSummaryRecipe, classes);
    const translations = useTranslations();
    const styles = formErrorSummary();
    const titleId = useId();
    const root = useRef<HTMLDivElement>(null);
    const count = errors.length;
    const hasErrors = count > 0;
    // Focus when errors appear and whenever focusKey changes while there are errors
    useEffect(() => {
        if (autoFocus && hasErrors) root.current?.focus();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autoFocus is read when errors appear, not watched
    }, [hasErrors, focusKey]);

    if (!count) return null;
    // After submitting: the summary takes the focus, each message leads to its field
    return (
        <div
            ref={root}
            {...props}
            className={styles.base({ class: className })}
            role="alert"
            tabIndex={-1}
            aria-labelledby={titleId}
        >
            <TitleTag id={titleId} className={styles.title()}>
                <CircleAlert className={styles.icon()} aria-hidden="true" />
                {title ?? translations.formErrorSummary.title(count)}
            </TitleTag>
            <ul className={styles.list()}>
                {errors.map((error, index) => (
                    <li key={error.id ?? index}>
                        {error.id ? (
                            <a
                                href={`#${error.id}`}
                                className={styles.link()}
                                onClick={(event) => {
                                    if (focusFormControl(error.id!)) event.preventDefault();
                                }}
                            >
                                {error.message}
                            </a>
                        ) : (
                            error.message
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}
