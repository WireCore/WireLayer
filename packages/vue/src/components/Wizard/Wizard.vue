<script setup lang="ts">
import { focusFirst, wizard as wizardRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed, nextTick, normalizeClass, ref, useAttrs, useTemplateRef, watch } from 'vue';
import Stepper from '../Stepper/Stepper.vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface WizardStep {
    label: string;
    description?: string;
    /**
     * Checks the step before going on ("Next"): false keeps it open (e.g. `() => validateFields(form, ['name'])`
     * from the form subpath), a text keeps it open and shows the text as the step's error (e.g. "Sign-in was
     * cancelled"); may be async – the step shows a spinner meanwhile. Going back never checks
     */
    validate?: () => boolean | string | Promise<boolean | string>;
}

export interface WizardProps {
    steps: readonly WizardStep[];
    /** Current step (0-based; steps + summary = done) – use with v-model:step */
    step?: number;
    defaultStep?: number;
    /** Name of the summary step – the step appears with the #summary slot (default "Summary") */
    summaryLabel?: string;
    /** Steps listed top to bottom beside the content */
    orientation?: 'horizontal' | 'vertical';
    /** Text of the last button, e.g. "Create" (default "Finish") */
    finishLabel?: string;
    /**
     * Moves the focus into a new step when the step changes: to the element marked data-autoselect (text selected),
     * data-autofocus or autofocus, otherwise to the step's first field
     */
    focusOnStepChange?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof wizardRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<WizardProps>(), { step: undefined, defaultStep: 0, orientation: 'horizontal' });
const wizard = useRecipe('wizard', wizardRecipe, () => props.classes);
const emit = defineEmits<{
    'update:step': [step: number];
    /** The last step was finished (after its check) */
    complete: [];
}>();
const slots = defineSlots<{
    /** Content of a step – its fields stay in the form state, so going back loses nothing */
    step?(props: { index: number; step: WizardStep }): unknown;
    /** A last step with this summary before finishing */
    summary?(): unknown;
    /** Shown after finishing */
    completed?(): unknown;
}>();
const attrs = useAttrs();
const translations = useTranslations();
const styles = wizard();
const root = useTemplateRef<HTMLElement>('root');
const internal = ref(props.defaultStep);
const current = computed(() => props.step ?? internal.value);
const checking = ref<number | null>(null);
const invalidAt = ref<number | null>(null);
// The text a step's check gave instead of false
const invalidText = ref<string | null>(null);
const items = computed(() => [
    ...props.steps.map((step, index) => ({
        label: step.label,
        description: step.description,
        loading: checking.value === index,
    })),
    ...(slots.summary ? [{ label: props.summaryLabel ?? translations.wizard.summary, loading: false }] : []),
]);

function set(next: number) {
    internal.value = next;
    emit('update:step', next);
    if (next === items.value.length) emit('complete');
}
/** Going on checks every step passed (in order); going back is free */
async function onStepChange(next: number) {
    if (checking.value !== null) return;
    invalidAt.value = null;
    invalidText.value = null;
    for (let index = current.value; index < next; index++) {
        const validate = props.steps[index]?.validate;
        if (!validate) continue;
        checking.value = index;
        let result: boolean | string;
        try {
            result = await validate();
        } finally {
            checking.value = null;
        }
        if (!result || typeof result === 'string') {
            if (index !== current.value) set(index);
            invalidAt.value = index;
            invalidText.value = typeof result === 'string' && result ? result : null;
            // The first invalid control of the step gets the focus
            await nextTick();
            root.value?.querySelector<HTMLElement>('[role=tabpanel]:not([hidden]) [aria-invalid=true]')?.focus();
            return;
        }
    }
    set(next);
}
// The new step's field gets the focus (not after a failed check: then its invalid field has it)
watch(current, async () => {
    if (!props.focusOnStepChange) return;
    await nextTick();
    if (invalidAt.value === null) focusFirst(root.value?.querySelector('[role=tabpanel]:not([hidden])'));
});
</script>

<template>
    <!--
        Multi-step form on the Stepper: "Next" checks the step (async with a spinner), "Back" keeps everything;
        an optional summary step before finishing.
    -->
    <div ref="root" v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }">
        <Stepper
            :items="items"
            :step="current"
            linear
            :orientation="orientation"
            :finish-label="finishLabel"
            @update:step="onStepChange"
        >
            <template #step="{ index }">
                <p v-if="invalidAt === index" :class="styles.error()" role="alert">
                    {{ invalidText ?? translations.wizard.invalid }}
                </p>
                <div v-if="index === steps.length" :class="styles.summary()"><slot name="summary" /></div>
                <slot v-else name="step" :index="index" :step="steps[index]!" />
            </template>
            <template #completed><slot name="completed" /></template>
        </Stepper>
    </div>
</template>
