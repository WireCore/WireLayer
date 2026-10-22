import { announcer, liveAnnouncer as liveAnnouncerRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { useEffect, useRef, type ReactNode } from 'react';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface LiveAnnouncerProps {
    children?: ReactNode;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof liveAnnouncerRecipe>;
}

/**
 * The live regions for announce() – one per politeness, rendered on the server already (screen readers only pick up
 * regions that exist before their text changes). Without a LiveAnnouncer, announce() adds them to <body>.
 */
export function LiveAnnouncer({ classes, children }: LiveAnnouncerProps) {
    const liveAnnouncer = useRecipe('liveAnnouncer', liveAnnouncerRecipe, classes);
    const polite = useRef<HTMLDivElement>(null);
    const assertive = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!polite.current || !assertive.current) return;
        return announcer.attach({ polite: polite.current, assertive: assertive.current });
    }, []);
    return (
        <>
            {children}
            <div className={liveAnnouncer()} data-wc-announcer="">
                <div ref={polite} role="status" aria-live="polite" aria-atomic="true" />
                <div ref={assertive} role="alert" aria-live="assertive" aria-atomic="true" />
            </div>
        </>
    );
}
