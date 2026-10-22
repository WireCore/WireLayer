<script setup lang="ts">
import { Brain, ChevronRight, LoaderCircle } from '@lucide/vue';
import { chatDetails as chatDetailsRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, useAttrs } from 'vue';
import { useLocale } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface ChatThinkingProps {
    /** Still thinking: "Thinking …" with a spinner, aria-busy */
    active?: boolean;
    /** The reasoning (plain text; the default slot replaces it) */
    text?: string;
    /** Seconds it took – shown when done */
    duration?: number;
    /** Open at first */
    defaultOpen?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof chatDetailsRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = defineProps<ChatThinkingProps>();
const chatDetails = useRecipe('chatDetails', chatDetailsRecipe, () => props.classes);
const attrs = useAttrs();
const locale = useLocale();
const t = computed(() => locale.value.translations.chatThinking);
const styles = computed(() => chatDetails({ status: props.active ? 'running' : 'none' }));
</script>

<template>
    <!-- The reasoning of an answer: collapsed by default, "Thinking …" while it is being written -->
    <details
        v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }"
        :open="defaultOpen || undefined"
        :aria-busy="active || undefined"
    >
        <summary :class="styles.summary()">
            <ChevronRight :class="styles.chevron()" aria-hidden="true" />
            <component :is="active ? LoaderCircle : Brain" :class="styles.icon()" aria-hidden="true" />
            <span :class="styles.title()">{{ active ? t.active : t.done }}</span>
            <span v-if="!active && duration !== undefined" :class="styles.badge()">{{ t.duration(duration) }}</span>
        </summary>
        <div v-if="text || $slots.default" :class="styles.content()">
            <slot>
                <p :class="styles.text()">{{ text }}</p>
            </slot>
        </div>
    </details>
</template>
