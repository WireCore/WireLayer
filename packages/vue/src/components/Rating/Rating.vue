<script setup lang="ts">
import { Star } from '@lucide/vue';
import { RatingGroup } from '@ark-ui/vue/rating-group';
import { rating as ratingRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, useAttrs, type Component } from 'vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

const translations = useTranslations();

export interface RatingProps {
    /** Rating – use with v-model */
    modelValue?: number;
    defaultValue?: number;
    /** Number of stars */
    count?: number;
    allowHalf?: boolean;
    /** Clicking the chosen star again (or Delete/Backspace) clears the rating (value 0) */
    allowClear?: boolean;
    /** Own symbol instead of the star, e.g. a heart (filled when chosen) */
    icon?: Component;
    readOnly?: boolean;
    disabled?: boolean;
    /** Visible label, also the group's accessible name */
    label?: string;
    size?: 'sm' | 'md' | 'lg';
    name?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof ratingRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<RatingProps>(), {
    modelValue: undefined,
    defaultValue: undefined,
    count: 5,
    allowHalf: undefined,
    allowClear: false,
    icon: () => Star,
    readOnly: undefined,
    disabled: undefined,
});
const rating = useRecipe('rating', ratingRecipe, () => props.classes);
const emit = defineEmits<{ 'update:modelValue': [value: number] }>();
const attrs = useAttrs();
const styles = computed(() => rating({ size: props.size }));

// allowClear: the value before the click – clicking it again clears
interface RatingApi {
    value: number;
    hoveredValue: number;
    clearValue(): void;
}
let before: number | null = null;
const remember = (api: RatingApi) => (before = api.value);
function onClick(api: RatingApi, index: number) {
    const clicked = api.hoveredValue > 0 ? api.hoveredValue : index;
    if (props.allowClear && before === clicked) api.clearValue();
    before = null;
}
function onKeydown(api: RatingApi, event: KeyboardEvent) {
    if (!props.allowClear || (event.key !== 'Delete' && event.key !== 'Backspace')) return;
    event.preventDefault();
    api.clearValue();
}
</script>

<template>
    <!-- Star rating: a radio group – arrow keys change the value, each star reads "3 stars" -->
    <RatingGroup.Root
        :class="styles.base({ class: normalizeClass(attrs.class) })"
        :style="attrs.style"
        :count="count"
        :model-value="modelValue"
        :default-value="defaultValue"
        :allow-half="allowHalf"
        :read-only="readOnly"
        :disabled="disabled"
        :name="name"
        :aria-label="label ? undefined : (attrs['aria-label'] as string | undefined)"
        :translations="translations.rating"
        @value-change="emit('update:modelValue', Math.max(0, $event.value))"
    >
        <RatingGroup.Label v-if="label" :class="styles.label()">{{ label }}</RatingGroup.Label>
        <RatingGroup.Control :class="styles.control()">
            <RatingGroup.Context v-slot="api">
                <RatingGroup.Item
                    v-for="index in api.items"
                    :key="index"
                    :index="index"
                    :class="styles.item()"
                    @pointerdown="remember(api)"
                    @click="onClick(api, index)"
                    @keydown="onKeydown(api, $event)"
                >
                    <RatingGroup.ItemContext v-slot="item">
                        <component
                            :is="icon"
                            :class="styles.icon()"
                            :fill="item.highlighted && !item.half ? 'currentColor' : 'none'"
                            aria-hidden="true"
                        />
                        <span v-if="item.half" :class="styles.half()">
                            <component :is="icon" :class="styles.icon()" fill="currentColor" aria-hidden="true" />
                        </span>
                    </RatingGroup.ItemContext>
                </RatingGroup.Item>
            </RatingGroup.Context>
        </RatingGroup.Control>
        <RatingGroup.HiddenInput />
    </RatingGroup.Root>
</template>
