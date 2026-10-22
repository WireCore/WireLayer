import { Fieldset as ArkFieldset } from '@ark-ui/react/fieldset';
import { fieldset as fieldsetRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { ChevronRight } from 'lucide-react';
import { useId, useState, type CSSProperties, type ReactNode } from 'react';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface FieldsetProps {
    legend: string;
    helperText?: string;
    /** Error of the whole group (e.g. "Please choose an option") */
    errorText?: string;
    invalid?: boolean;
    /** Disables every field inside (native fieldset – the legend's toggle stays usable) */
    disabled?: boolean;
    /** The legend becomes a button that shows/hides the fields (aria-expanded) */
    collapsible?: boolean;
    /** Open state of a collapsible fieldset (controlled, with onOpenChange) */
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    children: ReactNode;
    className?: string;
    style?: CSSProperties;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof fieldsetRecipe>;
}

/** <fieldset> with <legend>: names the group of fields; help and error text describe it */
export function Fieldset({
    classes,
    legend,
    helperText,
    errorText,
    invalid = false,
    disabled = false,
    collapsible = false,
    open,
    defaultOpen = true,
    onOpenChange,
    children,
    className,
    style,
}: FieldsetProps) {
    const fieldset = useRecipe('fieldset', fieldsetRecipe, classes);
    const styles = fieldset();
    const contentId = useId();
    const [internal, setInternal] = useState(defaultOpen);
    const isOpen = open ?? internal;
    return (
        <ArkFieldset.Root
            className={styles.base({ class: className })}
            style={style}
            invalid={invalid}
            disabled={disabled}
        >
            <ArkFieldset.Legend className={styles.legend()}>
                {collapsible ? (
                    <button
                        type="button"
                        className={styles.trigger()}
                        aria-expanded={isOpen}
                        aria-controls={contentId}
                        onClick={() => {
                            setInternal(!isOpen);
                            onOpenChange?.(!isOpen);
                        }}
                    >
                        <ChevronRight
                            className={styles.indicator()}
                            data-state={isOpen ? 'open' : 'closed'}
                            aria-hidden="true"
                        />
                        {legend}
                    </button>
                ) : (
                    legend
                )}
            </ArkFieldset.Legend>
            {helperText && (
                <ArkFieldset.HelperText className={styles.helperText()}>{helperText}</ArkFieldset.HelperText>
            )}
            {collapsible ? (
                <div id={contentId} className={styles.content()} hidden={!isOpen || undefined}>
                    {children}
                </div>
            ) : (
                children
            )}
            {errorText && <ArkFieldset.ErrorText className={styles.errorText()}>{errorText}</ArkFieldset.ErrorText>}
        </ArkFieldset.Root>
    );
}
