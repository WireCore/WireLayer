<script setup lang="ts">
import { ArrowLeft } from '@lucide/vue';
import { type BadgeVariant, pageHeader as pageHeaderRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, useAttrs } from 'vue';
import Badge from '../Badge/Badge.vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface PageHeaderProps {
    title: string;
    /** Level of the title (default 1 – the heading of the page) */
    headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
    /** Line below the title */
    subtitle?: string;
    /** Back link above the title, e.g. to the list */
    backHref?: string;
    /** Text of the back link (default "Back") */
    backLabel?: string;
    /** Status next to the title as a badge, e.g. "Draft" */
    status?: string;
    statusVariant?: BadgeVariant;
    /** sm: smaller title, e.g. inside a dialog or panel */
    size?: 'sm' | 'md';
    /** A line below the header */
    divided?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof pageHeaderRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<PageHeaderProps>(), { headingLevel: 1 });
const pageHeader = useRecipe('pageHeader', pageHeaderRecipe, () => props.classes);
/** The back link was clicked – call event.preventDefault() and route yourself in a single-page app */
const emit = defineEmits<{ back: [event: MouseEvent] }>();
const slots = defineSlots<{
    /** Breadcrumb above everything */
    breadcrumb?(): unknown;
    /** Meta information below the title (dates, owner …) */
    meta?(): unknown;
    /** Buttons at the end; they wrap below the title on narrow screens */
    actions?(): unknown;
    /** Tabs below the header */
    tabs?(): unknown;
}>();
const attrs = useAttrs();
const translations = useTranslations();
const styles = computed(() => pageHeader({ size: props.size, divided: props.divided }));
</script>

<template>
    <!-- Top of a page: breadcrumb, back link, title (heading) with status, subtitle and meta, actions, tabs -->
    <div v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }">
        <slot name="breadcrumb" />
        <a v-if="backHref" :href="backHref" :class="styles.back()" @click="emit('back', $event)">
            <ArrowLeft :class="styles.backIcon()" aria-hidden="true" />
            {{ backLabel ?? translations.pageHeader.back }}
        </a>
        <div :class="styles.row()">
            <div :class="styles.heading()">
                <div :class="styles.titleRow()">
                    <component :is="`h${headingLevel}`" :class="styles.title()">{{ title }}</component>
                    <Badge v-if="status" :variant="statusVariant">{{ status }}</Badge>
                </div>
                <p v-if="subtitle" :class="styles.subtitle()">{{ subtitle }}</p>
                <div v-if="slots.meta" :class="styles.meta()"><slot name="meta" /></div>
            </div>
            <div v-if="slots.actions" :class="styles.actions()"><slot name="actions" /></div>
        </div>
        <div v-if="slots.tabs" :class="styles.tabs()"><slot name="tabs" /></div>
    </div>
</template>
