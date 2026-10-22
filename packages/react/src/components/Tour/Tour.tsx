import { Portal } from '@ark-ui/react/portal';
import { Tour as ArkTour, useTour } from '@ark-ui/react/tour';
import { tour as tourRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from '../Button/Button.js';
import { IconButton } from '../IconButton/IconButton.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface TourStep {
    id: string;
    title: string;
    description: string;
    /** CSS selector of the element to show; without it the step is a centred dialog */
    target?: string;
    placement?: 'top' | 'bottom' | 'left' | 'right';
}

export interface TourProps {
    steps: TourStep[];
    /** Running – starting it sets it, the tour ends itself */
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    onComplete?: () => void;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof tourRecipe>;
}

/**
 * Step-by-step introduction: each step is a dialog next to its element (focus moves in, Escape ends the tour,
 * arrow keys move between steps).
 */
export function Tour({ classes, steps, open = false, onOpenChange, onComplete }: TourProps) {
    const styles = useRecipe('tour', tourRecipe, classes)();
    const translations = useTranslations();
    const t = translations.tour;
    const tour = useTour({
        steps: steps.map((step) => ({
            id: step.id,
            type: step.target ? 'tooltip' : 'dialog',
            title: step.title,
            description: step.description,
            placement: step.placement,
            target: step.target ? () => document.querySelector<HTMLElement>(step.target!) : undefined,
        })),
        translations: {
            close: t.close,
            skip: t.skip,
            nextStep: t.nextStep,
            prevStep: t.prevStep,
            progressText: t.progressText,
        },
        onStatusChange: (details) => {
            if (!['completed', 'dismissed', 'skipped'].includes(details.status)) return;
            if (details.stepIndex === steps.length - 1) onComplete?.();
            onOpenChange?.(false);
        },
    });
    // The tour ends itself (close button, Escape, last step); open only starts it
    useEffect(() => {
        if (open && !tour.open) tour.start();
    }, [open, tour]);

    const prevAction = { label: t.prevStep, action: 'prev' as const };
    const nextAction =
        tour.stepIndex < steps.length - 1
            ? { label: t.nextStep, action: 'next' as const }
            : { label: t.done, action: 'dismiss' as const };

    return (
        <ArkTour.Root tour={tour}>
            <Portal>
                <div className={styles.layer()}>
                    <ArkTour.Backdrop className={styles.backdrop()} />
                    <ArkTour.Spotlight className={styles.spotlight()} />
                    <ArkTour.Positioner className={styles.positioner()}>
                        <ArkTour.Content className={styles.content()}>
                            <ArkTour.Arrow className={styles.arrow()}>
                                <ArkTour.ArrowTip className={styles.arrowTip()} />
                            </ArkTour.Arrow>
                            <div className={styles.header()}>
                                <ArkTour.Title className={styles.title()} />
                                <ArkTour.CloseTrigger asChild>
                                    <IconButton icon={X} label={t.close} variant="text" size="sm" />
                                </ArkTour.CloseTrigger>
                            </div>
                            <ArkTour.Description className={styles.description()} />
                            <div className={styles.footer()}>
                                <ArkTour.ProgressText className={styles.progress()} />
                                <div className={styles.actions()}>
                                    {/* Ark's step actions get lost on element-bound steps – built from the step index.
                                        Named by their text (zag would name "Done" differently, WCAG 2.5.3) */}
                                    {tour.stepIndex > 0 && (
                                        <ArkTour.ActionTrigger
                                            action={prevAction}
                                            aria-label={prevAction.label}
                                            asChild
                                        >
                                            <Button size="sm" variant="outline">
                                                {prevAction.label}
                                            </Button>
                                        </ArkTour.ActionTrigger>
                                    )}
                                    <ArkTour.ActionTrigger action={nextAction} aria-label={nextAction.label} asChild>
                                        <Button size="sm">{nextAction.label}</Button>
                                    </ArkTour.ActionTrigger>
                                </div>
                            </div>
                        </ArkTour.Content>
                    </ArkTour.Positioner>
                </div>
            </Portal>
        </ArkTour.Root>
    );
}
