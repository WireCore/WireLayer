<script setup lang="ts">
import { Tour, useTour, type TourStepEffectArgs as StepEffectArgs } from '@ark-ui/vue/tour';
import { X } from '@lucide/vue';
import { prepareTourStep, tourSkipTarget, tour as tourRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed, ref, watch } from 'vue';
import Button from '../Button/Button.vue';
import IconButton from '../IconButton/IconButton.vue';
import { useRecipe } from '../../recipes.js';
import { useTranslations } from '../../locale.js';

const translations = useTranslations();

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
    /** Running – use with v-model:open */
    open?: boolean;
    /** Id of the step shown, null while the tour does not run – use with v-model:step; setting it moves there */
    step?: string | null;
    /** A step whose target is not there (after `waitFor`): skip it (default) or show it as a centred dialog */
    missingTarget?: 'skip' | 'dialog';
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof tourRecipe>;
}

const props = withDefaults(defineProps<TourProps>(), { open: false, step: undefined, missingTarget: 'skip' });
const emit = defineEmits<{ 'update:open': [open: boolean]; 'update:step': [step: string | null]; complete: [] }>();
const styles = useRecipe('tour', tourRecipe, () => props.classes)();
const t = translations.tour;

// A step is shown once its `before` has run and its target is there; meanwhile the previous one stays, busy
const pending = ref(false);
// Index of the step shown (-1: none yet) – a missing step is skipped in the direction the tour moves
let current = -1;
// The tour ends because the steps after the last one shown were skipped
let completing = false;
const finder = (selector: string) => () => document.querySelector<HTMLElement>(selector);

function skip(index: number, { goto, dismiss }: StepEffectArgs) {
    const target = tourSkipTarget(index, current, props.steps.length);
    if (typeof target === 'number') return goto(props.steps[target]!.id);
    if (target !== 'end') return;
    // Nothing shown yet: the tour never ran (zag has nothing to dismiss)
    if (current < 0) return emit('update:open', false);
    completing = true;
    dismiss();
}

const steps = computed(() =>
    props.steps.map((step, index) => ({
        id: step.id,
        type: step.target ? ('tooltip' as const) : ('dialog' as const),
        title: step.title,
        description: step.description,
        placement: step.placement,
        target: step.target ? finder(step.target) : undefined,
        effect: (args: StepEffectArgs) => {
            pending.value = true;
            const find = step.target ? finder(step.target) : undefined;
            const cancel = prepareTourStep({ before: step.before, find, waitFor: step.waitFor }, (_, missing) => {
                pending.value = false;
                if (missing && props.missingTarget === 'skip') return skip(index, args);
                // The step may have been shown as a dialog before (its target was missing then)
                if (find)
                    args.update(missing ? { type: 'dialog', target: undefined } : { type: 'tooltip', target: find });
                args.show();
            });
            return () => {
                cancel();
                pending.value = false;
            };
        },
    }))
);
const tour = useTour(
    computed(() => ({
        steps: steps.value,
        keyboardNavigation: !pending.value,
        translations: {
            close: t.close,
            skip: t.skip,
            nextStep: t.nextStep,
            prevStep: t.prevStep,
            progressText: t.progressText,
        },
        onStepChange: (details: { stepId: string | null; stepIndex: number }) => {
            // The end is reported once (below) – zag does not always clear the step
            if (details.stepId === null && current < 0) return;
            current = details.stepIndex;
            emit('update:step', details.stepId);
        },
        onStatusChange: (details: { status: string; stepIndex: number }) => {
            if (!['completed', 'dismissed', 'skipped', 'not-found'].includes(details.status)) return;
            // zag reports the last step as dismissed and then completed
            if (completing || details.status === 'completed') emit('complete');
            completing = false;
            if (current >= 0) emit('update:step', null);
            current = -1;
            emit('update:open', false);
        },
    }))
);
const prevAction = { label: t.prevStep, action: 'prev' as const };
const nextAction = computed(() =>
    tour.value.stepIndex < props.steps.length - 1
        ? { label: t.nextStep, action: 'next' as const }
        : { label: t.done, action: 'dismiss' as const }
);
// zag reads the steps once when it is created – later ones (e.g. set right before opening) are passed on
watch(steps, (next) => tour.value.setSteps(next));
watch(
    () => props.open,
    (open) => {
        // The tour ends itself (close button, Escape, last step); open only starts it
        if (open && !tour.value.open) tour.value.start(props.step ?? undefined);
    },
    { immediate: true }
);
watch(
    () => props.step,
    (step) => {
        if (step && tour.value.open && tour.value.step?.id !== step) tour.value.setStep(step);
    }
);
</script>

<template>
    <!--
        Step-by-step introduction: each step is a dialog next to its element (focus moves in, Escape ends the tour,
        arrow keys move between steps). Start it with v-model:open.
    -->
    <Tour.Root :tour="tour">
        <Teleport to="body">
            <div :class="styles.layer()">
                <Tour.Backdrop :class="styles.backdrop()" />
                <Tour.Spotlight :class="styles.spotlight()" />
                <Tour.Positioner :class="styles.positioner()">
                    <Tour.Content :class="styles.content()" :aria-busy="pending || undefined">
                        <Tour.Arrow :class="styles.arrow()"><Tour.ArrowTip :class="styles.arrowTip()" /></Tour.Arrow>
                        <div :class="styles.header()">
                            <Tour.Title :class="styles.title()" />
                            <Tour.CloseTrigger as-child>
                                <IconButton :icon="X" :label="t.close" variant="text" size="sm" />
                            </Tour.CloseTrigger>
                        </div>
                        <Tour.Description :class="styles.description()" />
                        <div :class="styles.footer()">
                            <Tour.ProgressText :class="styles.progress()" />
                            <div :class="styles.actions()">
                                <!-- Ark's step actions get lost on element-bound steps – built from the step index.
                                     Named by their text (zag would name "Done" differently, WCAG 2.5.3) -->
                                <Tour.ActionTrigger
                                    v-if="tour.stepIndex > 0"
                                    :action="prevAction"
                                    :aria-label="prevAction.label"
                                    as-child
                                >
                                    <Button size="sm" variant="outline" :disabled="pending">{{
                                        prevAction.label
                                    }}</Button>
                                </Tour.ActionTrigger>
                                <Tour.ActionTrigger :action="nextAction" :aria-label="nextAction.label" as-child>
                                    <Button size="sm" :disabled="pending">{{ nextAction.label }}</Button>
                                </Tour.ActionTrigger>
                            </div>
                        </div>
                    </Tour.Content>
                </Tour.Positioner>
            </div>
        </Teleport>
    </Tour.Root>
</template>
