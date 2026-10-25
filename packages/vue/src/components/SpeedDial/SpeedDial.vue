<script setup lang="ts">
import { Menu } from '@ark-ui/vue/menu';
import { Plus } from '@lucide/vue';
import {
    type RecipeClasses,
    type SpeedDialDirection,
    type SpeedDialLayout,
    speedDial as speedDialRecipe,
    speedDialPositions,
} from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, useAttrs, type Component } from 'vue';
import { useLocale, useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

const translations = useTranslations();

export interface SpeedDialItem {
    value: string;
    label: string;
    icon: Component;
    disabled?: boolean;
}

export interface SpeedDialProps {
    items: readonly SpeedDialItem[];
    /** Accessible name of the main button */
    label?: string;
    /**
     * `column` (default): above the button with visible labels; `circle`, `semicircle`, `quarter`: around it, the
     * labels show as tooltips on hover and focus
     */
    layout?: SpeedDialLayout;
    /** Where the actions open: up (default), down; for semicircle and quarter also left or right */
    direction?: SpeedDialDirection;
    /** Distance of the actions from the centre of the button in px (circle layouts, default 80) */
    radius?: number;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof speedDialRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<SpeedDialProps>(), { layout: 'column', direction: 'up', radius: 80 });
const speedDial = useRecipe('speedDial', speedDialRecipe, () => props.classes);
const emit = defineEmits<{ select: [value: string] }>();
const attrs = useAttrs();
const locale = useLocale();
const styles = computed(() => speedDial(props.layout === 'column' ? undefined : { layout: props.layout }));
// Around the button: the content is a point on its centre (placement top, gutter minus half the 56px button)
const positioning = computed(() =>
    props.layout === 'column'
        ? { placement: props.direction === 'down' ? ('bottom-end' as const) : ('top-end' as const), gutter: 12 }
        : { placement: 'top' as const, gutter: -28 }
);
const offsets = computed(() =>
    props.layout === 'column'
        ? []
        : speedDialPositions(
              props.items.length,
              props.layout,
              props.direction,
              props.radius,
              locale.value.dir === 'rtl'
          )
);
const itemStyle = (index: number) => {
    const offset = offsets.value[index];
    return offset ? { '--wc-x': `${offset.x}px`, '--wc-y': `${offset.y}px` } : undefined;
};
</script>

<template>
    <!--
        A menu button: the actions open above it (or in a circle around it) as menu items with their labels (arrow
        keys, Escape)
    -->
    <Menu.Root :positioning="positioning" lazy-mount unmount-on-exit @select="emit('select', $event.value)">
        <Menu.Trigger
            :class="styles.trigger({ class: normalizeClass(attrs.class) })"
            :style="attrs.style"
            :aria-label="label ?? translations.speedDial.label"
        >
            <Menu.Context v-slot="api">
                <Plus :class="styles.triggerIcon()" :data-state="api.open ? 'open' : 'closed'" aria-hidden="true" />
            </Menu.Context>
        </Menu.Trigger>
        <Teleport to="body">
            <Menu.Positioner>
                <Menu.Content :class="styles.content()">
                    <Menu.Item
                        v-for="(item, index) in items"
                        :key="item.value"
                        :value="item.value"
                        :disabled="item.disabled"
                        :class="styles.item()"
                        :style="itemStyle(index)"
                    >
                        <span :class="styles.label()">{{ item.label }}</span>
                        <span :class="styles.action()" aria-hidden="true">
                            <component :is="item.icon" :class="styles.actionIcon()" />
                        </span>
                    </Menu.Item>
                </Menu.Content>
            </Menu.Positioner>
        </Teleport>
    </Menu.Root>
</template>
