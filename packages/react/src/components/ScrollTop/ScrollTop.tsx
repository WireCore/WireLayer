import { scrollTop as scrollTopRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { ArrowUp } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { IconButton } from '../IconButton/IconButton.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface ScrollTopProps {
    /** Shown after scrolling this far (px) */
    threshold?: number;
    label?: string;
    className?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof scrollTopRecipe>;
}

function toTop() {
    const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
    // The next Tab starts at the top of the page again
    document.body.setAttribute('tabindex', '-1');
    document.body.focus({ preventScroll: true });
    document.body.addEventListener('blur', () => document.body.removeAttribute('tabindex'), { once: true });
}

/** Hidden (and out of the tab order) until the page is scrolled down */
export function ScrollTop({ classes, threshold = 400, label: labelProp, className }: ScrollTopProps) {
    const scrollTop = useRecipe('scrollTop', scrollTopRecipe, classes);
    const translations = useTranslations();
    const label = labelProp ?? translations.scrollTop.label;
    const [visible, setVisible] = useState(false);
    const button = useRef<HTMLButtonElement>(null);
    useEffect(() => {
        const update = () => {
            const shown = window.scrollY > threshold;
            // A hidden button must not keep the focus
            if (!shown && document.activeElement === button.current) button.current?.blur();
            setVisible(shown);
        };
        update();
        window.addEventListener('scroll', update, { passive: true });
        return () => window.removeEventListener('scroll', update);
    }, [threshold]);
    return (
        <IconButton
            ref={button}
            icon={ArrowUp}
            label={label}
            variant="primary"
            className={scrollTop({ class: className })}
            data-state={visible ? 'visible' : 'hidden'}
            tabIndex={visible ? undefined : -1}
            aria-hidden={visible ? undefined : 'true'}
            onClick={toTop}
        />
    );
}
