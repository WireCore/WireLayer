<script setup lang="ts">
import { isTruncated, truncate as truncateRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, onBeforeUnmount, onMounted, ref, useAttrs, useId, useTemplateRef, watch } from 'vue';
import Tooltip from '../Tooltip/Tooltip.vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface TruncateProps {
    /** The text */
    text: string;
    /** Lines before the text is cut (default 1: one line with an ellipsis) */
    lines?: number;
    /** The full text in a tooltip – only while it is cut; the text then becomes focusable for keyboard users */
    tooltip?: boolean;
    /** A "Show more" button below the cut text instead of the tooltip */
    expandable?: boolean;
    /** Expanded state with `expandable` – use with v-model:expanded */
    expanded?: boolean;
    defaultExpanded?: boolean;
    /** Element of the text (default span; p for paragraphs) */
    as?: 'span' | 'p' | 'div';
    /** Text of the button while cut / expanded */
    moreLabel?: string;
    lessLabel?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof truncateRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<TruncateProps>(), {
    lines: 1,
    tooltip: true,
    expanded: undefined,
    as: 'span',
});
const truncate = useRecipe('truncate', truncateRecipe, () => props.classes);
const emit = defineEmits<{ 'update:expanded': [expanded: boolean] }>();
const attrs = useAttrs();
const translations = useTranslations();
const id = useId();
const element = useTemplateRef<HTMLElement>('element');
const internal = ref(props.defaultExpanded ?? false);
const isExpanded = computed(() => props.expandable && (props.expanded ?? internal.value));
// Measured in the browser: the server renders the text without tooltip or button
const cut = ref(false);
const measure = () => {
    if (!isExpanded.value) cut.value = isTruncated(element.value);
};
let observer: ResizeObserver | undefined;
onMounted(() => {
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    observer = new ResizeObserver(measure);
    watch(
        element,
        (target) => {
            observer?.disconnect();
            if (target) observer?.observe(target);
        },
        { immediate: true }
    );
});
watch(() => [props.text, props.lines], measure, { flush: 'post' });
onBeforeUnmount(() => observer?.disconnect());

const styles = computed(() =>
    truncate({
        clamp: isExpanded.value ? 'all' : props.lines > 1 ? 'many' : 'one',
        focusable: !props.expandable && props.tooltip && cut.value,
    })
);
const lineStyle = computed(() => (props.lines > 1 ? { '--wc-lines': String(props.lines) } : undefined));
function toggle() {
    internal.value = !isExpanded.value;
    emit('update:expanded', !isExpanded.value);
}
</script>

<template>
    <!-- Expandable: the text and a button (aria-expanded) that shows all of it -->
    <div v-if="expandable" v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }">
        <component :is="as" :id="`${id}text`" ref="element" :class="styles.text()" :style="lineStyle">{{
            text
        }}</component>
        <button
            v-if="cut || isExpanded"
            type="button"
            :class="styles.toggle()"
            :aria-expanded="isExpanded"
            :aria-controls="`${id}text`"
            @click="toggle"
        >
            {{ isExpanded ? (lessLabel ?? translations.truncate.less) : (moreLabel ?? translations.truncate.more) }}
        </button>
    </div>
    <!-- Cut text; while cut, the full text is its tooltip (and it is focusable) -->
    <Tooltip v-else-if="tooltip" :content="text" :disabled="!cut">
        <component
            :is="as"
            ref="element"
            v-bind="attrs"
            :class="styles.text({ class: [styles.base(), normalizeClass(attrs.class)] })"
            :style="lineStyle"
            :tabindex="cut ? 0 : undefined"
            >{{ text }}</component
        >
    </Tooltip>
    <component
        :is="as"
        v-else
        ref="element"
        v-bind="attrs"
        :class="styles.text({ class: [styles.base(), normalizeClass(attrs.class)] })"
        :style="lineStyle"
        >{{ text }}</component
    >
</template>
