<script setup lang="ts">
import {
    avatarGroup as avatarGroupRecipe,
    formatCount,
    type RecipeClasses,
    type AvatarSize,
} from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, provide, useAttrs } from 'vue';
import { avatarGroupKey } from './context.js';
import { useRecipe } from '../../recipes.js';
import { useTranslations } from '../../locale.js';

export interface AvatarGroupProps {
    /** Size of all avatars in the group */
    size?: AvatarSize;
    /** Number of further people, shown as "+N" */
    more?: number;
    /** Accessible name of the "+N" bubble */
    moreLabel?: (count: number) => string;
    /** Accessible name of the group, e.g. "Project team" */
    label?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof avatarGroupRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<AvatarGroupProps>(), {
    size: 'sm',
});
const avatarGroup = useRecipe('avatarGroup', avatarGroupRecipe, () => props.classes);
const attrs = useAttrs();
const styles = computed(() => avatarGroup({ size: props.size }));
const translations = useTranslations();
const labelOf = (count: number) => props.moreLabel?.(count) ?? `${count} ${translations.overflowList.more}`;

provide(
    avatarGroupKey,
    computed(() => props.size)
);
</script>

<template>
    <div
        v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }"
        role="group"
        :aria-label="label"
    >
        <slot />
        <span v-if="more" :class="styles.more()" role="img" :aria-label="labelOf(more)">
            +{{ formatCount(more) }}
        </span>
    </div>
</template>
