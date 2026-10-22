<script setup lang="ts">
import { ChevronRight, Link } from '@lucide/vue';
import { chatDetails as chatDetailsRecipe, sourceHost, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, useAttrs } from 'vue';
import { useLocale } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

/** A source of an answer */
export interface ChatSource {
    title: string;
    href: string;
    /** Short excerpt or description */
    description?: string;
}

export interface ChatSourcesProps {
    sources: ChatSource[];
    /** Summary text (default "3 sources") */
    title?: string;
    /** Open at first */
    defaultOpen?: boolean;
    /** target of the links, e.g. "_blank" */
    linkTarget?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof chatDetailsRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = defineProps<ChatSourcesProps>();
const chatDetails = useRecipe('chatDetails', chatDetailsRecipe, () => props.classes);
const attrs = useAttrs();
const locale = useLocale();
const styles = computed(() => chatDetails());
</script>

<template>
    <!-- Sources of an answer: a disclosure (<details>) with a list of links -->
    <details
        v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }"
        :open="defaultOpen || undefined"
    >
        <summary :class="styles.summary()">
            <ChevronRight :class="styles.chevron()" aria-hidden="true" />
            <Link :class="styles.icon()" aria-hidden="true" />
            <span :class="styles.title()">{{ title ?? locale.translations.chatSources.title(sources.length) }}</span>
        </summary>
        <div :class="styles.content()">
            <ol :class="styles.list()">
                <li v-for="source in sources" :key="source.href">
                    <a
                        :href="source.href"
                        :class="styles.link()"
                        :target="linkTarget"
                        :rel="linkTarget ? 'noopener noreferrer' : undefined"
                        >{{ source.title }}</a
                    >
                    <span :class="styles.host()"> · {{ sourceHost(source.href) }}</span>
                    <p v-if="source.description" :class="styles.description()">{{ source.description }}</p>
                </li>
            </ol>
        </div>
    </details>
</template>
