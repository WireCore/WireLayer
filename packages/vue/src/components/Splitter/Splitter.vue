<script setup lang="ts">
import { Splitter, useSplitter } from '@ark-ui/vue/splitter';
import { GripHorizontal, GripVertical } from '@lucide/vue';
import { readStored, type RecipeClasses, splitter as splitterRecipe, writeStored } from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, onMounted, useAttrs } from 'vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

const translations = useTranslations();

export interface SplitterPanel {
    id: string;
    /** Names the panel for the resize handle ("Resize “…”") */
    label: string;
    /** Initial size: a number in percent, or a string with unit, e.g. "240px" or "30%" */
    defaultSize?: number | string;
    /** Limits: percent, or a string with unit ("200px") */
    minSize?: number | string;
    maxSize?: number | string;
    /** Dragging (or keys) below the minimum snaps the panel shut; Enter on the handle opens and closes it */
    collapsible?: boolean;
    /** Size when collapsed (default 0) */
    collapsedSize?: number | string;
}

export interface SplitterProps {
    panels: SplitterPanel[];
    orientation?: 'horizontal' | 'vertical';
    /** Arrow keys on a handle change the size by this many percent (default 1) */
    step?: number;
    /** Shift + arrow keys (percent, default 10) */
    shiftStep?: number;
    /** Remembers the sizes in localStorage under this key */
    storageKey?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof splitterRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<SplitterProps>(), { orientation: 'horizontal' });
const splitter = useRecipe('splitter', splitterRecipe, () => props.classes);
const emit = defineEmits<{
    /** Sizes in percent while resizing */
    resize: [sizes: number[]];
    /** Sizes in percent after a drag or key press */
    resizeEnd: [sizes: number[]];
    collapse: [panelId: string];
    expand: [panelId: string];
}>();
defineSlots<{ panel(props: { id: string }): unknown }>();
const attrs = useAttrs();
const styles = splitter();
// Panels without a size share what the others leave; sizes with a unit are resolved by Ark
const defaultSize = computed(() => {
    if (props.panels.some((panel) => typeof panel.defaultSize === 'string')) {
        return props.panels.map((panel) => panel.defaultSize) as (number | string)[];
    }
    const given = props.panels.reduce((sum, panel) => sum + ((panel.defaultSize as number | undefined) ?? 0), 0);
    const open = props.panels.filter((panel) => panel.defaultSize === undefined).length;
    return props.panels.map((panel) => panel.defaultSize ?? (100 - given) / open);
});
const constraints = computed(() =>
    props.panels.map((panel) => ({
        id: panel.id,
        minSize: panel.minSize,
        maxSize: panel.maxSize,
        ...(panel.collapsible ? { collapsible: true, collapsedSize: panel.collapsedSize ?? 0 } : {}),
    }))
);
const api = useSplitter(
    computed(() => ({
        orientation: props.orientation,
        panels: constraints.value,
        defaultSize: defaultSize.value,
        ...(props.step === undefined ? {} : { keyboardResizeBy: props.step }),
        onResize: (details: { size: number[] }) => emit('resize', details.size),
        onResizeEnd: (details: { size: number[] }) => {
            writeStored(props.storageKey, details.size);
            emit('resizeEnd', details.size);
        },
        onCollapse: (details: { panelId: string }) => {
            writeStored(props.storageKey, api.value.getSizes());
            emit('collapse', details.panelId);
        },
        onExpand: (details: { panelId: string }) => {
            writeStored(props.storageKey, api.value.getSizes());
            emit('expand', details.panelId);
        },
    }))
);
onMounted(() => {
    const stored = readStored<number[]>(props.storageKey);
    if (Array.isArray(stored) && stored.length === props.panels.length) api.value.setSizes(stored);
});

// Shift + arrow keys: our own step (Ark's is fixed at 10 %); runs before Ark's handler, which then skips the key
function onKeydown(before: string, event: KeyboardEvent) {
    if (!event.shiftKey || props.shiftStep === undefined) return;
    const rtl = getComputedStyle(event.currentTarget as Element).direction === 'rtl';
    const grows = props.orientation === 'vertical' ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight';
    const shrinks = props.orientation === 'vertical' ? 'ArrowUp' : rtl ? 'ArrowRight' : 'ArrowLeft';
    const sign = event.key === grows ? 1 : event.key === shrinks ? -1 : 0;
    if (!sign) return;
    event.preventDefault();
    api.value.resizePanel(before, api.value.getPanelSize(before) + sign * props.shiftStep);
    writeStored(props.storageKey, api.value.getSizes());
    emit('resizeEnd', api.value.getSizes());
}
// Double click on a handle: back to the initial sizes
function reset() {
    api.value.resetSizes();
    writeStored(props.storageKey, api.value.getSizes());
    emit('resizeEnd', api.value.getSizes());
}
</script>

<template>
    <!--
        Panels with handles between them (role="separator"): drag, or arrow keys (Shift for bigger steps) and Home/End
        on the handle; Enter folds a collapsible panel; double click resets. Splitters can be nested in a panel.
    -->
    <div :class="styles.base({ class: normalizeClass(attrs.class) })" :style="attrs.style">
        <Splitter.RootProvider :value="api" :class="styles.root()">
            <template v-for="(panel, index) in panels" :key="panel.id">
                <Splitter.ResizeTrigger
                    v-if="index > 0"
                    :id="`${panels[index - 1]!.id}:${panel.id}`"
                    :class="styles.handle()"
                    :aria-label="translations.splitter.resize(panels[index - 1]!.label)"
                    @keydown.capture="onKeydown(panels[index - 1]!.id, $event)"
                    @dblclick="reset"
                >
                    <span :class="styles.grip()" :data-orientation="orientation" aria-hidden="true">
                        <GripVertical v-if="orientation === 'horizontal'" :class="styles.gripIcon()" />
                        <GripHorizontal v-else :class="styles.gripIcon()" />
                    </span>
                </Splitter.ResizeTrigger>
                <Splitter.Panel :id="panel.id" :class="styles.panel()">
                    <slot :id="panel.id" name="panel" />
                </Splitter.Panel>
            </template>
        </Splitter.RootProvider>
    </div>
</template>
