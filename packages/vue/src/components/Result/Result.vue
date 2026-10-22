<script setup lang="ts">
import { CircleCheck, CircleX, Info, SearchX, ServerCrash, ShieldX, TriangleAlert } from '@lucide/vue';
import { type RecipeClasses, result as resultRecipe, type ResultStatus } from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, useAttrs, type Component } from 'vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface ResultProps {
    /** success, info (default), warn, error, or the HTTP errors 403, 404, 500 (with the code above the title) */
    status?: ResultStatus;
    /** Default per status, e.g. "Page not found" */
    title?: string;
    /** Text below the title; 403, 404 and 500 have one by default */
    description?: string;
    /** Own icon for the illustration */
    icon?: Component;
    /** Level of the title (default 2; 1 when the result is the whole page) */
    headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof resultRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<ResultProps>(), { status: 'info', headingLevel: 2 });
const result = useRecipe('result', resultRecipe, () => props.classes);
const slots = defineSlots<{ default?(): unknown; actions?(): unknown }>();
const attrs = useAttrs();
const translations = useTranslations();
const styles = computed(() => result({ status: props.status }));
const icons: Record<ResultStatus, Component> = {
    success: CircleCheck,
    info: Info,
    warn: TriangleAlert,
    error: CircleX,
    '403': ShieldX,
    '404': SearchX,
    '500': ServerCrash,
};
const isCode = computed(() => /^\d+$/.test(props.status));
const text = computed(() => {
    const texts = translations.result;
    const fallback = {
        '403': texts.description403,
        '404': texts.description404,
        '500': texts.description500,
    } as Record<string, string>;
    return { title: props.title ?? texts[props.status], description: props.description ?? fallback[props.status] };
});
</script>

<template>
    <!-- Result or error page: illustration (decorative icon), optional status code, title (heading), text, actions -->
    <div v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }">
        <div :class="styles.illustration()" aria-hidden="true">
            <component :is="icon ?? icons[status]" :class="styles.icon()" />
        </div>
        <p v-if="isCode" :class="styles.code()">{{ status }}</p>
        <component :is="`h${headingLevel}`" :class="styles.title()">{{ text.title }}</component>
        <p v-if="text.description" :class="styles.description()">{{ text.description }}</p>
        <div v-if="slots.default" :class="styles.extra()"><slot /></div>
        <div v-if="slots.actions" :class="styles.actions()"><slot name="actions" /></div>
    </div>
</template>
