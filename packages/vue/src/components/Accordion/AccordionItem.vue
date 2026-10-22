<script setup lang="ts">
import { Accordion } from '@ark-ui/vue/accordion';
import { ChevronDown } from '@lucide/vue';
import { accordion as accordionRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, useAttrs, type Component } from 'vue';
import { useRecipe } from '../../recipes.js';

export interface AccordionItemProps {
    value: string;
    /** Title of the trigger (also via #title) */
    title?: string;
    /** Icon component before the title */
    icon?: Component;
    disabled?: boolean;
    /** Level of the heading around the trigger, to fit the page outline */
    headingLevel?: 2 | 3 | 4 | 5 | 6;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof accordionRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<AccordionItemProps>(), { disabled: undefined, headingLevel: 3 });
const accordion = useRecipe('accordion', accordionRecipe, () => props.classes);
const attrs = useAttrs();
const slots = defineSlots<{
    default?: () => unknown;
    title?: () => unknown;
    /** Own controls next to the heading (e.g. an IconButton) – beside the trigger, not inside it */
    actions?: () => unknown;
}>();
const styles = computed(() => accordion({ withActions: !!slots.actions }));
</script>

<template>
    <Accordion.Item
        v-bind="{ ...attrs, class: styles.item({ class: normalizeClass(attrs.class) }) }"
        :value="value"
        :disabled="disabled"
    >
        <div v-if="slots.actions" :class="styles.header()">
            <component :is="`h${headingLevel}`" :class="styles.heading()">
                <Accordion.ItemTrigger :class="styles.trigger()">
                    <component :is="icon" v-if="icon" :class="styles.icon()" aria-hidden="true" />
                    <span :class="styles.title()"
                        ><slot name="title">{{ title }}</slot></span
                    >
                    <Accordion.ItemIndicator :class="styles.indicator()">
                        <ChevronDown :class="styles.indicatorIcon()" aria-hidden="true" />
                    </Accordion.ItemIndicator>
                </Accordion.ItemTrigger>
            </component>
            <div :class="styles.actions()"><slot name="actions" /></div>
        </div>
        <component :is="`h${headingLevel}`" v-else :class="styles.heading()">
            <Accordion.ItemTrigger :class="styles.trigger()">
                <component :is="icon" v-if="icon" :class="styles.icon()" aria-hidden="true" />
                <span :class="styles.title()"
                    ><slot name="title">{{ title }}</slot></span
                >
                <Accordion.ItemIndicator :class="styles.indicator()">
                    <ChevronDown :class="styles.indicatorIcon()" aria-hidden="true" />
                </Accordion.ItemIndicator>
            </Accordion.ItemTrigger>
        </component>
        <Accordion.ItemContent :class="styles.content()">
            <div :class="styles.body()"><slot /></div>
        </Accordion.ItemContent>
    </Accordion.Item>
</template>
