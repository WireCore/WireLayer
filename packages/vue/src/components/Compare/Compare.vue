<script setup lang="ts">
import { ChevronsLeftRight } from '@lucide/vue';
import { compare as compareRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, ref, useAttrs } from 'vue';
import { useRecipe } from '../../recipes.js';
import { useLocale, useTranslations } from '../../locale.js';

export interface CompareImage {
    src: string;
    alt: string;
}

export interface CompareProps {
    /** Shown on the start side (left, right-to-left: right) */
    before: CompareImage;
    after: CompareImage;
    /** Accessible name of the slider */
    label?: string;
    beforeLabel?: string;
    afterLabel?: string;
    /** Share of the before image in percent – use with v-model */
    modelValue?: number;
    defaultValue?: number;
    /** Aspect ratio of the area (CSS) */
    aspectRatio?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof compareRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<CompareProps>(), {
    modelValue: undefined,
    defaultValue: 50,
    aspectRatio: '16 / 9',
});
const emit = defineEmits<{ 'update:modelValue': [value: number] }>();
const compare = useRecipe('compare', compareRecipe, () => props.classes);
const attrs = useAttrs();
const styles = computed(() => compare());
const localeContext = useLocale();
const t = useTranslations().compare;

const internal = ref(props.defaultValue);
const value = computed(() => props.modelValue ?? internal.value);
// The before image is cut off on the end side
const clipPath = computed(() =>
    localeContext.value.dir === 'rtl' ? `inset(0 0 0 ${100 - value.value}%)` : `inset(0 ${100 - value.value}% 0 0)`
);
function set(next: number) {
    internal.value = next;
    emit('update:modelValue', next);
}
</script>

<template>
    <!-- Two images on top of each other; the range input over them moves the line (drag, click, arrow keys) -->
    <div v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }" :style="{ aspectRatio }">
        <img :class="styles.image()" :src="after.src" :alt="after.alt" />
        <img :class="styles.image()" :src="before.src" :alt="before.alt" :style="{ clipPath }" />
        <span :class="styles.label({ class: styles.beforeLabel() })" aria-hidden="true">{{
            beforeLabel ?? t.before
        }}</span>
        <span :class="styles.label({ class: styles.afterLabel() })" aria-hidden="true">{{
            afterLabel ?? t.after
        }}</span>
        <span :class="styles.divider()" :style="{ insetInlineStart: `${value}%` }">
            <span :class="styles.handle()">
                <ChevronsLeftRight :class="styles.handleIcon()" aria-hidden="true" />
            </span>
        </span>
        <input
            :class="styles.input()"
            type="range"
            min="0"
            max="100"
            step="1"
            :value="value"
            :aria-label="label ?? t.label"
            :aria-valuetext="t.valueText(value)"
            @input="set(Number(($event.target as HTMLInputElement).value))"
        />
    </div>
</template>
