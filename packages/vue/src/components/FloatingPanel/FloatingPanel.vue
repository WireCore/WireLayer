<script setup lang="ts">
import { FloatingPanel, useFloatingPanel } from '@ark-ui/vue/floating-panel';
import { Maximize2, Minimize2, Minus, X } from '@lucide/vue';
import {
    floatingPanel as floatingPanelRecipe,
    panelRectForKey,
    readStorage,
    writeStorage,
    type PanelRect,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, onMounted, ref, useAttrs, useId } from 'vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

type Size = { width: number; height: number };
type Point = { x: number; y: number };

export interface FloatingPanelProps {
    /** Title in the header – also the name of the window */
    title: string;
    /** Open – use with v-model:open */
    open?: boolean;
    defaultOpen?: boolean;
    /** Size when it opens (default 360 × 280) */
    defaultSize?: Size;
    /** Position when it opens (default: next to the trigger, else centred) */
    defaultPosition?: Point;
    /** Smallest and largest size (default min 240 × 120) */
    minSize?: Size;
    maxSize?: Size;
    /** Edges and corners change the size (default true) */
    resizable?: boolean;
    /** The header moves the window (default true) */
    draggable?: boolean;
    /** Keeps position and size in localStorage under this key */
    storageKey?: string;
    /** Escape closes the window (default true) */
    closeOnEscape?: boolean;
    /** Pixels per Alt+arrow (default 10) */
    keyboardStep?: number;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof floatingPanelRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<FloatingPanelProps>(), {
    open: undefined,
    defaultSize: () => ({ width: 360, height: 280 }),
    minSize: () => ({ width: 240, height: 120 }),
    resizable: true,
    draggable: true,
    closeOnEscape: true,
    keyboardStep: 10,
});
const emit = defineEmits<{ 'update:open': [open: boolean] }>();
defineSlots<{
    /** Button that opens the window (its position is the anchor) */
    trigger?(): unknown;
    /** Content of the window */
    default?(): unknown;
}>();
const floatingPanel = useRecipe('floatingPanel', floatingPanelRecipe, () => props.classes);
const attrs = useAttrs();
const t = useTranslations().floatingPanel;
const styles = floatingPanel();
const id = useId();
const hintId = `${id}hint`;
const internalOpen = ref(props.defaultOpen ?? false);
const position = ref<Point | undefined>(props.defaultPosition);
const size = ref<Size>(props.defaultSize);
onMounted(() => {
    if (!props.storageKey) return;
    const stored = readStorage<Partial<PanelRect>>('local', props.storageKey);
    if (stored?.position) position.value = stored.position;
    if (stored?.size) size.value = stored.size;
});
function store() {
    if (props.storageKey && position.value)
        writeStorage('local', props.storageKey, { position: position.value, size: size.value });
}

const api = useFloatingPanel(
    computed(() => ({
        id,
        open: props.open ?? internalOpen.value,
        position: position.value,
        size: size.value,
        minSize: props.minSize,
        maxSize: props.maxSize,
        resizable: props.resizable,
        draggable: props.draggable,
        closeOnEscape: props.closeOnEscape,
        persistRect: true,
        translations: { minimize: t.minimize, maximize: t.maximize, restore: t.restore },
        onOpenChange: ({ open }: { open: boolean }) => {
            internalOpen.value = open;
            emit('update:open', open);
        },
        onPositionChange: ({ position: next }: { position: Point }) => (position.value = next),
        onPositionChangeEnd: store,
        onSizeChange: ({ size: next }: { size: Size }) => (size.value = next),
        onSizeChangeEnd: store,
    }))
);

// Alt+arrows move, Alt+Shift+arrows resize – from anywhere in the window (before Ark's own arrow handling)
function onKeydown(event: KeyboardEvent) {
    const next = panelRectForKey(
        event,
        { position: api.value.position, size: api.value.size },
        { step: props.keyboardStep, minSize: props.minSize, maxSize: props.maxSize }
    );
    if (!next) return;
    event.preventDefault();
    if (next.position && props.draggable) api.value.setPosition(next.position);
    if (next.size && props.resizable) api.value.setSize(next.size);
    store();
}
const axes = ['n', 'e', 's', 'w', 'ne', 'se', 'sw', 'nw'] as const;
</script>

<template>
    <!--
        Non-modal window (role="dialog", named by its title): drag the header, resize at the edges, minimise,
        maximise, close; Alt+arrows move it, Alt+Shift+arrows resize it, Escape closes it.
    -->
    <FloatingPanel.RootProvider :value="api" lazy-mount unmount-on-exit>
        <FloatingPanel.Trigger v-if="$slots.trigger" as-child><slot name="trigger" /></FloatingPanel.Trigger>
        <Teleport to="body">
            <FloatingPanel.Positioner :class="styles.positioner()">
                <FloatingPanel.Content
                    v-bind="{ ...attrs, class: styles.content({ class: normalizeClass(attrs.class) }) }"
                    :aria-describedby="hintId"
                    @keydown.capture="onKeydown"
                >
                    <FloatingPanel.DragTrigger>
                        <FloatingPanel.Header :class="styles.header()">
                            <FloatingPanel.Title :class="styles.title()">{{ title }}</FloatingPanel.Title>
                            <FloatingPanel.Control :class="styles.control()">
                                <FloatingPanel.StageTrigger v-if="resizable" stage="minimized" :class="styles.button()">
                                    <Minus :class="styles.buttonIcon()" aria-hidden="true" />
                                </FloatingPanel.StageTrigger>
                                <FloatingPanel.StageTrigger v-if="resizable" stage="maximized" :class="styles.button()">
                                    <Maximize2 :class="styles.buttonIcon()" aria-hidden="true" />
                                </FloatingPanel.StageTrigger>
                                <FloatingPanel.StageTrigger v-if="resizable" stage="default" :class="styles.button()">
                                    <Minimize2 :class="styles.buttonIcon()" aria-hidden="true" />
                                </FloatingPanel.StageTrigger>
                                <FloatingPanel.CloseTrigger :class="styles.button()" :aria-label="t.close">
                                    <X :class="styles.buttonIcon()" aria-hidden="true" />
                                </FloatingPanel.CloseTrigger>
                            </FloatingPanel.Control>
                        </FloatingPanel.Header>
                    </FloatingPanel.DragTrigger>
                    <FloatingPanel.Body :class="styles.body()"><slot /></FloatingPanel.Body>
                    <span :id="hintId" :class="styles.hint()">{{ t.hint }}</span>
                    <template v-if="resizable">
                        <FloatingPanel.ResizeTrigger
                            v-for="axis in axes"
                            :key="axis"
                            :axis="axis"
                            :class="styles.resize()"
                        />
                    </template>
                </FloatingPanel.Content>
            </FloatingPanel.Positioner>
        </Teleport>
    </FloatingPanel.RootProvider>
</template>
