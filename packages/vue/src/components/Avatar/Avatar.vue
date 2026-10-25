<script setup lang="ts">
import { Avatar } from '@ark-ui/vue/avatar';
import { User } from '@lucide/vue';
import {
    avatar as avatarRecipe,
    avatarColor,
    type AvatarColor,
    type AvatarShape,
    type AvatarSize,
    type AvatarVariant,
    getInitials,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { computed, inject, normalizeClass, useAttrs, type Component } from 'vue';
import { avatarGroupKey } from './context.js';
import { useRecipe } from '../../recipes.js';

export interface AvatarProps {
    /** Person or organisation – accessible name of the avatar and source of the initials */
    name?: string;
    /** Image URL; initials (or the icon) are shown while it loads or if it fails */
    src?: string;
    /** Icon shown when there is neither an image nor a name (default: user icon) */
    icon?: Component;
    variant?: AvatarVariant;
    /** Inherited from a surrounding AvatarGroup if not set */
    size?: AvatarSize;
    shape?: AvatarShape;
    /**
     * Tinted background in a token colour; `auto` picks one from the name, so the same person always gets the same
     * colour (all pairs meet 4.5:1)
     */
    color?: AvatarColor | 'auto';
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof avatarRecipe>;
    /** `button`: a button with the avatar as its content, e.g. the trigger of a user menu (name: `name` or aria-label) */
    as?: 'div' | 'button';
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<AvatarProps>(), { as: 'div' });
const avatar = useRecipe('avatar', avatarRecipe, () => props.classes);
const attrs = useAttrs();
const groupSize = inject(avatarGroupKey, null);

const styles = computed(() =>
    avatar({
        variant: props.variant,
        size: props.size ?? groupSize?.value,
        shape: props.shape,
        color: props.color === 'auto' ? (props.name ? avatarColor(props.name) : undefined) : props.color,
        grouped: !!groupSize,
        interactive: props.as === 'button',
    })
);
const initials = computed(() => (props.name ? getInitials(props.name) : ''));
</script>

<template>
    <!-- With a name the avatar is one image for assistive tech, without it is decorative; as a button it is named -->
    <Avatar.Root as-child>
        <component
            :is="as"
            v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }"
            :type="as === 'button' ? 'button' : undefined"
            :role="as === 'div' && name ? 'img' : undefined"
            :aria-label="attrs['aria-label'] ?? (name || undefined)"
            :aria-hidden="as === 'div' && !name ? 'true' : undefined"
        >
            <Avatar.Fallback :class="styles.fallback()">
                <template v-if="initials">{{ initials }}</template>
                <component :is="icon ?? User" v-else :class="styles.icon()" aria-hidden="true" />
            </Avatar.Fallback>
            <Avatar.Image v-if="src" :src="src" alt="" :class="styles.image()" />
        </component>
    </Avatar.Root>
</template>
