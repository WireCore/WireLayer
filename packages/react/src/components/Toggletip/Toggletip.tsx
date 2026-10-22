import { toggletip as toggletipRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { Info } from 'lucide-react';
import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import type { IconComponent } from '../../types.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface ToggletipProps extends Omit<ComponentProps<'span'>, 'content'> {
    /** The explanation (or children) */
    content?: ReactNode;
    /** What it explains, e.g. the field label – names the button "More information about <label>" */
    label?: string;
    /** Own accessible name of the button */
    triggerLabel?: string;
    /** Open state (controlled) */
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    /** Icon of the button (default: info) */
    icon?: IconComponent;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof toggletipRecipe>;
}

/**
 * (i) button: a click shows the explanation in a bubble inside a live region (role="status"), so screen readers read
 * it; Escape, a second click or a click outside close it. Not modal, the focus stays on the button.
 */
export function Toggletip({
    classes,
    content,
    label,
    triggerLabel,
    open,
    onOpenChange,
    icon: Icon = Info,
    className,
    children,
    ...props
}: ToggletipProps) {
    const toggletip = useRecipe('toggletip', toggletipRecipe, classes);
    const translations = useTranslations();
    const styles = toggletip();
    const [internal, setInternal] = useState(false);
    const isOpen = open ?? internal;
    const root = useRef<HTMLSpanElement>(null);
    const setOpen = (next: boolean) => {
        setInternal(next);
        onOpenChange?.(next);
    };
    const latest = useRef(setOpen);
    useEffect(() => {
        latest.current = setOpen;
    });
    // While open: Escape and a click outside close it (the focus stays on the button)
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (event: KeyboardEvent) => {
            if (event.key !== 'Escape') return;
            event.stopPropagation();
            latest.current(false);
        };
        const onPointer = (event: PointerEvent) => {
            if (!root.current?.contains(event.target as Node)) latest.current(false);
        };
        document.addEventListener('keydown', onKey);
        document.addEventListener('pointerdown', onPointer);
        return () => {
            document.removeEventListener('keydown', onKey);
            document.removeEventListener('pointerdown', onPointer);
        };
    }, [isOpen]);
    const name = triggerLabel ?? (label ? translations.toggletip.labelFor(label) : translations.toggletip.label);
    return (
        <span {...props} ref={root} className={styles.base({ class: className })}>
            <button
                type="button"
                className={styles.trigger()}
                aria-label={name}
                aria-expanded={isOpen}
                onClick={() => setOpen(!isOpen)}
            >
                <Icon className={styles.icon()} aria-hidden="true" />
            </button>
            <span role="status">{isOpen && <span className={styles.bubble()}>{children ?? content}</span>}</span>
        </span>
    );
}
