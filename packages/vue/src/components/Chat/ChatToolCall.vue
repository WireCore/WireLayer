<script setup lang="ts">
import { ChevronRight, CircleCheck, CircleX, LoaderCircle, Wrench } from '@lucide/vue';
import { chatDetails as chatDetailsRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, useAttrs } from 'vue';
import { useLocale } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface ChatToolCallProps {
    /** Name of the tool, e.g. "Get weather" */
    name: string;
    /** running, done or error – shown as icon and text */
    status?: 'running' | 'done' | 'error';
    /** Arguments of the call (objects are shown as JSON) */
    input?: unknown;
    /** Result of the call (objects are shown as JSON) */
    output?: unknown;
    /** Open at first */
    defaultOpen?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof chatDetailsRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<ChatToolCallProps>(), { status: 'done', input: undefined, output: undefined });
const chatDetails = useRecipe('chatDetails', chatDetailsRecipe, () => props.classes);
const attrs = useAttrs();
const locale = useLocale();
const t = computed(() => locale.value.translations.chatToolCall);
const styles = computed(() => chatDetails({ status: props.status }));
const icons = { running: LoaderCircle, done: CircleCheck, error: CircleX };
const show = (value: unknown) => (typeof value === 'string' ? value : JSON.stringify(value, null, 2));
</script>

<template>
    <!-- A tool call of an assistant: name and status in the summary, arguments and result inside -->
    <details
        v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }"
        :open="defaultOpen || undefined"
    >
        <summary :class="styles.summary()">
            <ChevronRight :class="styles.chevron()" aria-hidden="true" />
            <Wrench :class="chatDetails().icon()" aria-hidden="true" />
            <span :class="styles.title()">{{ t.title(name) }}</span>
            <component :is="icons[status]" :class="styles.icon()" aria-hidden="true" />
            <span :class="styles.badge()">{{ t.status[status] }}</span>
        </summary>
        <div v-if="input !== undefined || output !== undefined || $slots.default" :class="styles.content()">
            <template v-if="input !== undefined">
                <div :class="styles.label()">{{ t.input }}</div>
                <pre :class="styles.pre()">{{ show(input) }}</pre>
            </template>
            <template v-if="output !== undefined">
                <div :class="styles.label()">{{ t.output }}</div>
                <pre :class="styles.pre()">{{ show(output) }}</pre>
            </template>
            <slot />
        </div>
    </details>
</template>
