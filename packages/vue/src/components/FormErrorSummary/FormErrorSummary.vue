<script setup lang="ts">
import { CircleAlert } from '@lucide/vue';
import {
    focusFormControl,
    formErrorSummary as formErrorSummaryRecipe,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { computed, nextTick, normalizeClass, onMounted, useAttrs, useId, useTemplateRef, watch } from 'vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface FormErrorSummaryItem {
    /** Error text, e.g. "Please enter a valid email address" */
    message: string;
    /** Id of the field's control (e.g. Field `id`) – the message links to it and focuses it */
    id?: string;
}

export interface FormErrorSummaryProps {
    /** The current errors; nothing is rendered without any */
    errors: FormErrorSummaryItem[];
    /** Heading (default "Please correct 2 entries") */
    title?: string;
    /** Element of the heading – pick the level that fits the page outline */
    titleTag?: 'h2' | 'h3' | 'h4' | 'p';
    /** Moves the focus to the summary when errors appear (WCAG 3.3.1) */
    autoFocus?: boolean;
    /** Focuses the summary again whenever this changes while there are errors, e.g. the number of submit attempts */
    focusKey?: unknown;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof formErrorSummaryRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<FormErrorSummaryProps>(), { titleTag: 'h2', autoFocus: true });
const formErrorSummary = useRecipe('formErrorSummary', formErrorSummaryRecipe, () => props.classes);
const translations = useTranslations();
const attrs = useAttrs();
const styles = computed(() => formErrorSummary());
const titleId = useId();
const root = useTemplateRef<HTMLElement>('root');

const focus = () => nextTick(() => root.value?.focus());
onMounted(() => {
    if (props.autoFocus && props.errors.length) void focus();
});
watch(
    () => [props.errors.length, props.focusKey] as const,
    ([count, key], [before, keyBefore]) => {
        if (props.autoFocus && count && (!before || key !== keyBefore)) void focus();
    }
);
defineExpose({ focus });

function jump(event: MouseEvent, id: string) {
    if (focusFormControl(id)) event.preventDefault();
}
</script>

<template>
    <!-- After submitting: the summary takes the focus, each message leads to its field -->
    <div
        v-if="errors.length"
        ref="root"
        v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }"
        role="alert"
        tabindex="-1"
        :aria-labelledby="titleId"
    >
        <component :is="titleTag" :id="titleId" :class="styles.title()">
            <CircleAlert :class="styles.icon()" aria-hidden="true" />{{
                title ?? translations.formErrorSummary.title(errors.length)
            }}
        </component>
        <ul :class="styles.list()">
            <li v-for="(error, index) in errors" :key="error.id ?? index">
                <a v-if="error.id" :href="`#${error.id}`" :class="styles.link()" @click="jump($event, error.id)">{{
                    error.message
                }}</a>
                <template v-else>{{ error.message }}</template>
            </li>
        </ul>
    </div>
</template>
