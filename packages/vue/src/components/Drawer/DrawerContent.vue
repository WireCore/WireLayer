<script setup lang="ts">
import { Dialog } from '@ark-ui/vue/dialog';
import { X } from '@lucide/vue';
import {
    drawer as drawerRecipe,
    type DrawerPlacement,
    type OverlaySize,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { computed, inject, normalizeClass, useAttrs } from 'vue';
import { dialogRootKey } from '../Dialog/context.js';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

const translations = useTranslations();

export interface DrawerContentProps {
    title: string;
    /** The title only for screen readers – it still names the drawer (e.g. a video in a dialog) */
    hideTitle?: boolean;
    description?: string;
    placement?: DrawerPlacement;
    /**
     * Width (left/right: sm 320px, md 420px, lg 560px, xl 720px) or height (top/bottom: 30–85 % of the screen);
     * `full` covers the whole screen. Without it 420px wide or as high as the content
     */
    size?: OverlaySize;
    /** Floats with a gap to the screen edge and rounded corners */
    offset?: boolean;
    /** Shows the close button in the header */
    closable?: boolean;
    /** Accessible name of the close button */
    closeLabel?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof drawerRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<DrawerContentProps>(), { closable: true });
defineSlots<{
    /** The content below the title (scrolls) */
    default?(): unknown;
    /** Buttons at the bottom, e.g. Cancel and Save */
    footer?(): unknown;
}>();
const drawer = useRecipe('drawer', drawerRecipe, () => props.classes);
const attrs = useAttrs();
const root = inject(dialogRootKey, null);
const styles = computed(() =>
    drawer({ placement: props.placement, size: props.size, offset: props.offset, hideTitle: props.hideTitle })
);
</script>

<template>
    <Teleport to="body">
        <Dialog.Backdrop v-if="root?.modal ?? true" :class="styles.backdrop()" />
        <Dialog.Positioner :class="styles.positioner()">
            <Dialog.Content v-bind="{ ...attrs, class: styles.content({ class: normalizeClass(attrs.class) }) }">
                <div :class="styles.header()">
                    <div :class="styles.text()">
                        <Dialog.Title :class="styles.title()">{{ title }}</Dialog.Title>
                        <Dialog.Description v-if="description" :class="styles.description()">
                            {{ description }}
                        </Dialog.Description>
                    </div>
                    <Dialog.CloseTrigger
                        v-if="closable"
                        :class="styles.close()"
                        :aria-label="closeLabel ?? translations.common.close"
                    >
                        <X :class="styles.closeIcon()" aria-hidden="true" />
                    </Dialog.CloseTrigger>
                </div>
                <div :class="styles.body()"><slot /></div>
                <div v-if="$slots.footer" :class="styles.footer()"><slot name="footer" /></div>
            </Dialog.Content>
        </Dialog.Positioner>
    </Teleport>
</template>
