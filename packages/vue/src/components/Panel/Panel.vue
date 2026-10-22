<script setup lang="ts">
import { Collapsible } from '@ark-ui/vue/collapsible';
import { ChevronRight } from '@lucide/vue';
import { panel as panelRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { normalizeClass, useAttrs } from 'vue';
import { useRecipe } from '../../recipes.js';

export interface PanelProps {
    title: string;
    /** Heading level of the title */
    headingLevel?: 2 | 3 | 4;
    /** The title becomes a button that shows/hides the content */
    toggleable?: boolean;
    /** Open state – use with v-model:open */
    open?: boolean;
    defaultOpen?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof panelRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<PanelProps>(), {
    headingLevel: 3,
    toggleable: false,
    open: undefined,
    defaultOpen: true,
});
const panel = useRecipe('panel', panelRecipe, () => props.classes);
const emit = defineEmits<{ 'update:open': [open: boolean] }>();
defineSlots<{ default(): unknown; actions?(): unknown; footer?(): unknown }>();
const attrs = useAttrs();
const styles = panel();
</script>

<template>
    <!-- Card with a heading (and actions); toggleable: the heading holds a button with aria-expanded -->
    <Collapsible.Root
        v-if="toggleable"
        :class="styles.base({ class: normalizeClass(attrs.class) })"
        :style="attrs.style"
        :open="open"
        :default-open="defaultOpen"
        @open-change="emit('update:open', $event.open)"
    >
        <div :class="styles.header()">
            <component :is="`h${headingLevel}`" :class="styles.title()">
                <Collapsible.Trigger :class="styles.trigger()">
                    <Collapsible.Indicator as-child>
                        <ChevronRight :class="styles.indicator()" aria-hidden="true" />
                    </Collapsible.Indicator>
                    {{ title }}
                </Collapsible.Trigger>
            </component>
            <div v-if="$slots.actions" :class="styles.actions()"><slot name="actions" /></div>
        </div>
        <Collapsible.Content :class="styles.content()">
            <div :class="styles.body()"><slot /></div>
            <div v-if="$slots.footer" :class="styles.footer()"><slot name="footer" /></div>
        </Collapsible.Content>
    </Collapsible.Root>
    <section v-else :class="styles.base({ class: normalizeClass(attrs.class) })" :style="attrs.style">
        <div :class="styles.header()">
            <component :is="`h${headingLevel}`" :class="styles.title()">{{ title }}</component>
            <div v-if="$slots.actions" :class="styles.actions()"><slot name="actions" /></div>
        </div>
        <div :class="styles.content()">
            <div :class="styles.body()"><slot /></div>
            <div v-if="$slots.footer" :class="styles.footer()"><slot name="footer" /></div>
        </div>
    </section>
</template>
