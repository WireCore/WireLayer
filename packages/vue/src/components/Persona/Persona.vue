<script setup lang="ts">
import {
    persona as personaRecipe,
    type AvatarColor,
    type RecipeClasses,
    type StatusDotStatus,
} from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, useAttrs } from 'vue';
import Avatar from '../Avatar/Avatar.vue';
import StatusDot from '../StatusDot/StatusDot.vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export type PersonaPresence = 'online' | 'away' | 'busy' | 'offline';

export interface PersonaProps {
    /** Name of the person – also the source of the initials */
    name: string;
    /** Role or description below the name, e.g. "Project lead" */
    description?: string;
    /** Image URL of the avatar */
    src?: string;
    /** Presence as a dot with text (never colour alone) */
    presence?: PersonaPresence;
    /** Own text for the presence (default "Online", "Away" …) */
    presenceLabel?: string;
    size?: 'sm' | 'md' | 'lg';
    /** Tinted avatar; `auto` picks a colour from the name */
    avatarColor?: AvatarColor | 'auto';
    /** The whole persona is a link */
    href?: string;
    /** `button`: the whole persona is a button (listen to click) */
    as?: 'div' | 'button';
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof personaRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<PersonaProps>(), { size: 'md', avatarColor: 'auto', as: 'div' });
const persona = useRecipe('persona', personaRecipe, () => props.classes);
const attrs = useAttrs();
const translations = useTranslations();
const tag = computed(() => (props.href ? 'a' : props.as));
const styles = computed(() => persona({ size: props.size, interactive: tag.value !== 'div' }));
const presenceStatus: Record<PersonaPresence, StatusDotStatus> = {
    online: 'success',
    away: 'warn',
    busy: 'danger',
    offline: 'neutral',
};
</script>

<template>
    <!-- Avatar (decorative here – the name follows as text), name, description and presence; optionally a link/button -->
    <component
        :is="tag"
        v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }"
        :href="href"
        :type="tag === 'button' ? 'button' : undefined"
    >
        <span :class="styles.avatar()" aria-hidden="true">
            <Avatar :name="name" :src="src" :size="size" :color="avatarColor" />
        </span>
        <span :class="styles.body()">
            <span :class="styles.name()">{{ name }}</span>
            <span v-if="description" :class="styles.description()">{{ description }}</span>
            <StatusDot v-if="presence" :status="presenceStatus[presence]" :class="styles.presence()">{{
                presenceLabel ?? translations.persona.presence[presence]
            }}</StatusDot>
        </span>
    </component>
</template>
