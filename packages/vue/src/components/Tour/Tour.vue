<script setup lang="ts">
import { Tour, useTour } from '@ark-ui/vue/tour';
import { X } from '@lucide/vue';
import { tour as tourRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed, watch } from 'vue';
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
}

export interface TourProps {
    steps: readonly TourStep[];
    /** Running – use with v-model:open */
    open?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof tourRecipe>;
}

const props = withDefaults(defineProps<TourProps>(), { open: false });
const emit = defineEmits<{ 'update:open': [open: boolean]; complete: [] }>();
const styles = useRecipe('tour', tourRecipe, () => props.classes)();
const t = translations.tour;

const steps = computed(() =>
    props.steps.map((step) => ({
        id: step.id,
        type: step.target ? ('tooltip' as const) : ('dialog' as const),
        title: step.title,
        description: step.description,
        placement: step.placement,
        target: step.target ? () => document.querySelector<HTMLElement>(step.target!) : undefined,
    }))
);
const tour = useTour(
    computed(() => ({
        steps: steps.value,
        translations: {
            close: t.close,
            skip: t.skip,
            nextStep: t.nextStep,
            prevStep: t.prevStep,
            progressText: t.progressText,
        },
        onStatusChange: (details: { status: string; stepIndex: number }) => {
            if (!['completed', 'dismissed', 'skipped'].includes(details.status)) return;
            if (details.stepIndex === props.steps.length - 1) emit('complete');
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
watch(
    () => props.open,
    (open) => {
        // The tour ends itself (close button, Escape, last step); open only starts it
        if (open && !tour.value.open) tour.value.start();
    },
    { immediate: true }
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
                    <Tour.Content :class="styles.content()">
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
                                    <Button size="sm" variant="outline">{{ prevAction.label }}</Button>
                                </Tour.ActionTrigger>
                                <Tour.ActionTrigger :action="nextAction" :aria-label="nextAction.label" as-child>
                                    <Button size="sm">{{ nextAction.label }}</Button>
                                </Tour.ActionTrigger>
                            </div>
                        </div>
                    </Tour.Content>
                </Tour.Positioner>
            </div>
        </Teleport>
    </Tour.Root>
</template>
