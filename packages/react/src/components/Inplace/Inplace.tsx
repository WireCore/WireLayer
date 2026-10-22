import { inplace as inplaceRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface InplaceProps {
    active?: boolean;
    onActiveChange?: (active: boolean) => void;
    /** Hint for screen readers after the shown text, e.g. "bearbeiten" */
    editLabel?: string;
    /** The value as it is shown */
    display: ReactNode;
    /** The editor; call close() when done */
    children: (close: () => void) => ReactNode;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof inplaceRecipe>;
}

/** Shows a value as a button; activating it swaps in the editor (Escape closes it) */
export function Inplace({
    classes,
    active,
    onActiveChange,
    editLabel: editLabelProp,
    display,
    children,
}: InplaceProps) {
    const inplace = useRecipe('inplace', inplaceRecipe, classes);
    const styles = inplace();
    const translations = useTranslations();
    const editLabel = editLabelProp ?? translations.inplace.edit;
    const [internal, setInternal] = useState(false);
    const isActive = active ?? internal;
    const content = useRef<HTMLDivElement>(null);
    const button = useRef<HTMLButtonElement>(null);
    // Where the focus goes after the last change: into the editor, or back to the text
    const [focusTarget, setFocusTarget] = useState<'editor' | 'display' | null>(null);
    const set = (next: boolean) => {
        setInternal(next);
        onActiveChange?.(next);
        setFocusTarget(next ? 'editor' : 'display');
    };
    // Back to the text a task later, so the Enter that saved does not land on the text button and open the
    // editor again
    useEffect(() => {
        if (focusTarget === 'editor')
            content.current?.querySelector<HTMLElement>('input, textarea, select, button, [tabindex]')?.focus();
        else if (focusTarget === 'display') setTimeout(() => button.current?.focus());
    }, [focusTarget]);

    if (!isActive)
        return (
            <button ref={button} type="button" className={styles.display()} onClick={() => set(true)}>
                {display}
                <span className={styles.hint()}>{`(${editLabel})`}</span>
            </button>
        );
    return (
        <div
            ref={content}
            className={styles.content()}
            onKeyDown={(event: KeyboardEvent) => {
                if (event.key !== 'Escape') return;
                event.preventDefault();
                set(false);
            }}
        >
            {children(() => set(false))}
        </div>
    );
}
