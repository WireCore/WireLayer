<script setup lang="ts">
import { SlidersHorizontal } from '@lucide/vue';
import { filterPanel as filterPanelRecipe, visuallyHidden, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, ref, useAttrs, useId, watch } from 'vue';
import FilterChips, { type FilterChip } from './FilterChips.vue';
import Collapse from '../Collapse/Collapse.vue';
import Drawer from '../Drawer/Drawer.vue';
import DrawerContent from '../Drawer/DrawerContent.vue';
import { useMediaQuery } from '../../composables/media.js';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface FilterPanelProps {
    /** The active filters – shown as chips and counted on the button */
    filters?: readonly FilterChip[];
    /** Number on the button (default: the number of filters) */
    count?: number;
    /** Form shown – use with v-model:open */
    open?: boolean;
    defaultOpen?: boolean;
    /** Name of the region, the button and the drawer (default "Filter") */
    label?: string;
    /**
     * `inline` (default): the form folds open below the bar; `drawer`: it opens in a drawer; `auto`: a drawer on small
     * screens (`drawerQuery`)
     */
    display?: 'inline' | 'drawer' | 'auto';
    /** When `auto` uses the drawer (default below 768px) */
    drawerQuery?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof filterPanelRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<FilterPanelProps>(), {
    filters: () => [],
    open: undefined,
    display: 'inline',
    drawerQuery: '(max-width: 767px)',
});
const filterPanel = useRecipe('filterPanel', filterPanelRecipe, () => props.classes);
const emit = defineEmits<{
    'update:open': [open: boolean];
    /** A chip's remove button */
    remove: [id: string];
    /** "Reset all" */
    clear: [];
}>();
const slots = defineSlots<{ default?(): unknown; actions?(): unknown }>();
const attrs = useAttrs();
const translations = useTranslations();
const t = translations.filterPanel;
const styles = filterPanel();
const id = useId();
const internal = ref(props.defaultOpen ?? false);
const isOpen = computed(() => props.open ?? internal.value);
const narrow = useMediaQuery(() => props.drawerQuery);
const asDrawer = computed(() => props.display === 'drawer' || (props.display === 'auto' && narrow.value));
const activeCount = computed(() => props.count ?? props.filters.length);
const name = computed(() => props.label ?? t.label);
const hidden = visuallyHidden();
function setOpen(next: boolean) {
    internal.value = next;
    emit('update:open', next);
}
// Changes of the number of active filters are announced (not the first render)
const status = ref('');
watch(activeCount, (count) => (status.value = t.status(count)));
</script>

<template>
    <!--
        Filter region above a list or table: a button with the number of active filters opens the compact form
        (folding open, or a drawer on small screens); the active filters as removable chips.
    -->
    <section v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }" :aria-label="name">
        <div :class="styles.bar()">
            <button
                type="button"
                :class="styles.toggle()"
                :aria-expanded="isOpen"
                :aria-controls="asDrawer ? undefined : `${id}content`"
                :aria-haspopup="asDrawer ? 'dialog' : undefined"
                @click="setOpen(!isOpen)"
            >
                <SlidersHorizontal :class="styles.toggleIcon()" aria-hidden="true" />{{ label ?? t.toggle }}
                <template v-if="activeCount"
                    ><span :class="styles.count()">{{ activeCount }}</span>
                    <span :class="hidden">{{ t.active }}</span></template
                >
            </button>
            <FilterChips :filters="filters" @remove="emit('remove', $event)" @clear="emit('clear')" />
            <div v-if="slots.actions" :class="styles.actions()"><slot name="actions" /></div>
        </div>
        <Collapse v-if="!asDrawer" :id="`${id}content`" :open="isOpen">
            <div :class="styles.content()"><slot /></div>
        </Collapse>
        <Drawer v-else :open="isOpen" @update:open="setOpen">
            <DrawerContent :title="name" placement="right"><slot /></DrawerContent>
        </Drawer>
        <span role="status" :class="hidden">{{ status }}</span>
    </section>
</template>
