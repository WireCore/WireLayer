import { Portal } from '@ark-ui/react/portal';
import { Tour as ArkTour, useTour, type TourStepEffectArgs as StepEffectArgs } from '@ark-ui/react/tour';
import { prepareTourStep, tourSkipTarget, tour as tourRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
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
    /** Runs before the step is shown (also for the first step and when going back), may be async – e.g. switches a tab */
    before?: () => void | Promise<void>;
    /** How long (ms) to wait for `target` after `before`, e.g. while it loads (default 0: look once) */
    waitFor?: number;
}

export interface TourProps {
    steps: readonly TourStep[];
    /** Running – starting it sets it, the tour ends itself */
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    /** Id of the step shown, null while the tour does not run; setting it moves there */
    step?: string | null;
    onStepChange?: (step: string | null) => void;
    /** A step whose target is not there (after `waitFor`): skip it (default) or show it as a centred dialog */
    missingTarget?: 'skip' | 'dialog';
    onComplete?: () => void;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof tourRecipe>;
}

/**
 * Step-by-step introduction: each step is a dialog next to its element (focus moves in, Escape ends the tour,
 * arrow keys move between steps).
 */
export function Tour({
    classes,
    steps,
    open = false,
    onOpenChange,
    step,
    onStepChange,
    missingTarget = 'skip',
    onComplete,
}: TourProps) {
    const styles = useRecipe('tour', tourRecipe, classes)();
    const translations = useTranslations();
    const t = translations.tour;
    // A step is shown once its `before` has run and its target is there; meanwhile the previous one stays, busy
    const [pending, setPending] = useState(false);
    // The latest props for the step effects (they run later)
    const latest = useRef({ steps, missingTarget, onOpenChange });
    useEffect(() => {
        latest.current = { steps, missingTarget, onOpenChange };
    });
    // Index of the step shown (-1: none yet) – a missing step is skipped in the direction the tour moves
    const current = useRef(-1);
    // The tour ends because the steps after the last one shown were skipped
    const completing = useRef(false);

    const zagSteps = useMemo(() => {
        const finder = (selector: string) => () => document.querySelector<HTMLElement>(selector);
        const skip = (index: number, { goto, dismiss }: StepEffectArgs) => {
            const all = latest.current.steps;
            const target = tourSkipTarget(index, current.current, all.length);
            if (typeof target === 'number') return goto(all[target]!.id);
            if (target !== 'end') return;
            // Nothing shown yet: the tour never ran (zag has nothing to dismiss)
            if (current.current < 0) return latest.current.onOpenChange?.(false);
            completing.current = true;
            dismiss();
        };
        return steps.map((step, index) => ({
            id: step.id,
            type: step.target ? ('tooltip' as const) : ('dialog' as const),
            title: step.title,
            description: step.description,
            placement: step.placement,
            target: step.target ? finder(step.target) : undefined,
            effect: (args: StepEffectArgs) => {
                setPending(true);
                const find = step.target ? finder(step.target) : undefined;
                const cancel = prepareTourStep({ before: step.before, find, waitFor: step.waitFor }, (_, missing) => {
                    setPending(false);
                    if (missing && latest.current.missingTarget === 'skip') return skip(index, args);
                    // The step may have been shown as a dialog before (its target was missing then)
                    if (find)
                        args.update(
                            missing ? { type: 'dialog', target: undefined } : { type: 'tooltip', target: find }
                        );
                    args.show();
                });
                return () => {
                    cancel();
                    setPending(false);
                };
            },
        }));
    }, [steps]);
    const tour = useTour({
        steps: zagSteps,
        keyboardNavigation: !pending,
        translations: {
            close: t.close,
            skip: t.skip,
            nextStep: t.nextStep,
            prevStep: t.prevStep,
            progressText: t.progressText,
        },
        onStepChange: (details) => {
            // The end is reported once (below) – zag does not always clear the step
            if (details.stepId === null && current.current < 0) return;
            current.current = details.stepIndex;
            onStepChange?.(details.stepId);
        },
        onStatusChange: (details) => {
            if (!['completed', 'dismissed', 'skipped', 'not-found'].includes(details.status)) return;
            // zag reports the last step as dismissed and then completed
            if (completing.current || details.status === 'completed') onComplete?.();
            completing.current = false;
            if (current.current >= 0) onStepChange?.(null);
            current.current = -1;
            onOpenChange?.(false);
        },
    });
    // zag reads the steps once when it is created – later ones (e.g. set right before opening) are passed on
    const passed = useRef(zagSteps);
    useEffect(() => {
        if (passed.current === zagSteps) return;
        passed.current = zagSteps;
        tour.setSteps(zagSteps);
    }, [zagSteps, tour]);
    // The tour ends itself (close button, Escape, last step); open only starts it – once, the first step may still be
    // preparing (`before`, `waitFor`) while the tour is not shown yet
    const started = useRef(false);
    useEffect(() => {
        if (open && !started.current && !tour.open) tour.start(step ?? undefined);
        started.current = open;
    }, [open, tour, step]);
    // A step set from outside: move there (only when it changes – the tour moves on by itself)
    const requested = useRef(step);
    useEffect(() => {
        if (requested.current === step) return;
        requested.current = step;
        if (step && tour.open && tour.step?.id !== step) tour.setStep(step);
    }, [step, tour]);

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
                        <ArkTour.Content className={styles.content()} aria-busy={pending || undefined}>
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
                                            <Button size="sm" variant="outline" disabled={pending}>
                                                {prevAction.label}
                                            </Button>
                                        </ArkTour.ActionTrigger>
                                    )}
                                    <ArkTour.ActionTrigger action={nextAction} aria-label={nextAction.label} asChild>
                                        <Button size="sm" disabled={pending}>
                                            {nextAction.label}
                                        </Button>
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
