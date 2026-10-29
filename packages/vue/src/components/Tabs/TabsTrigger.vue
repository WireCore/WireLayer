<script setup lang="ts">
import { Tabs } from '@ark-ui/vue/tabs';
import { X } from '@lucide/vue';
import { closeTab, type RecipeClasses, tabs as tabsRecipe } from '@wirecore/wirelayer-recipes';
import {
    computed,
    inject,
    normalizeClass,
    onMounted,
    onUpdated,
    ref,
    useAttrs,
    useTemplateRef,
    type Component,
} from 'vue';
import { tabsNoneSelectedKey } from './context.js';
import { useRecipe } from '../../recipes.js';

export interface TabsTriggerProps {
    value: string;
    /** Icon component before the label */
    icon?: Component;
    disabled?: boolean;
    /**
     * Shows a close button (pointer) and closes with the Delete key; `close` reports it – remove the tab (and select
     * another one) yourself. The focus moves to the neighbouring tab
     */
    closable?: boolean;
    /**
     * Id of the element the tab shows, when it is not a TabsContent of these Tabs (e.g. a pane elsewhere shown with
     * v-show) – `null`: none (tabs without panels)
     */
    controls?: string | null;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof tabsRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<TabsTriggerProps>(), {
    disabled: undefined,
    closable: false,
    controls: undefined,
});
const emit = defineEmits<{ close: [value: string] }>();
const tabs = useRecipe('tabs', tabsRecipe, () => props.classes);
const attrs = useAttrs();
const styles = computed(() => tabs({ closable: props.closable }));

// No tab selected (Tabs value null): Ark takes every tab out of the Tab order – the first enabled one stays in it
const noneSelected = inject(tabsNoneSelectedKey, null);
const trigger = useTemplateRef<{ $el: HTMLElement }>('trigger');
const first = ref(false);
const checkFirst = () => {
    const element = trigger.value?.$el;
    first.value =
        !!element && element.closest('[role=tablist]')?.querySelector('[role=tab]:not([disabled])') === element;
};
onMounted(checkFirst);
onUpdated(checkFirst);
// null removes Ark's aria-controls (undefined would keep it)
const own = computed(() => ({
    ...(props.controls !== undefined ? { 'aria-controls': props.controls as string | undefined } : {}),
    ...(noneSelected?.value && first.value ? { tabIndex: 0 } : {}),
}));

function onKeydown(event: KeyboardEvent) {
    if (!props.closable || event.key !== 'Delete' || event.defaultPrevented || props.disabled) return;
    event.preventDefault();
    closeTab(event.currentTarget as HTMLElement, () => emit('close', props.value));
}
function onCloseClick(event: MouseEvent) {
    const tab = (event.currentTarget as HTMLElement).parentElement?.querySelector<HTMLElement>('[role=tab]');
    if (tab) closeTab(tab, () => emit('close', props.value));
}
</script>

<template>
    <!-- The close button is not part of the tab (no button in a button): pointer only, Delete closes by keyboard -->
    <span v-if="closable" role="presentation" :class="styles.tab()">
        <Tabs.Trigger
            ref="trigger"
            v-bind="{ ...attrs, ...own, class: styles.trigger({ class: normalizeClass(attrs.class) }) }"
            :value="value"
            :disabled="disabled"
            aria-keyshortcuts="Delete"
            @keydown="onKeydown"
        >
            <component :is="icon" v-if="icon" :class="styles.icon()" aria-hidden="true" />
            <slot />
        </Tabs.Trigger>
        <button
            type="button"
            tabindex="-1"
            aria-hidden="true"
            :class="styles.close()"
            :disabled="disabled"
            @click="onCloseClick"
        >
            <X :class="styles.closeIcon()" />
        </button>
    </span>
    <Tabs.Trigger
        v-else
        ref="trigger"
        v-bind="{ ...attrs, ...own, class: styles.trigger({ class: normalizeClass(attrs.class) }) }"
        :value="value"
        :disabled="disabled"
    >
        <component :is="icon" v-if="icon" :class="styles.icon()" aria-hidden="true" />
        <slot />
    </Tabs.Trigger>
</template>
