<script setup lang="ts">
import { Popover, usePopoverContext } from '@ark-ui/vue/popover';
import { X } from '@lucide/vue';
import { popover as popoverRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed, inject, normalizeClass, useAttrs, useId } from 'vue';
import { popoverRootKey } from './context.js';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

const translations = useTranslations();

export interface PopoverContentProps {
    /** Accessible name of the panel (role="dialog") */
    title: string;
    /** The title only for screen readers, e.g. when the content speaks for itself */
    hideTitle?: boolean;
    description?: string;
    /** Shows the close button (default true); without it the panel closes with Escape, outside clicks or PopoverClose */
    closable?: boolean;
    /** Accessible name of the close button */
    closeLabel?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof popoverRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<PopoverContentProps>(), { closable: true });
const popover = useRecipe('popover', popoverRecipe, () => props.classes);
const attrs = useAttrs();
const root = inject(popoverRootKey, null);
const context = usePopoverContext();
const styles = computed(() => popover({ width: root?.value.width, hideTitle: props.hideTitle }));
// Ark only links title/description that exist when the popover is created – with lazy mounting they don't
const titleId = useId();
const descriptionId = useId();
</script>

<template>
    <Teleport to="body">
        <div v-if="root?.overlay && context.open" :class="styles.backdrop()" data-state="open" aria-hidden="true" />
        <Popover.Positioner>
            <Popover.Content
                :aria-labelledby="titleId"
                :aria-describedby="description ? descriptionId : undefined"
                v-bind="{ ...attrs, class: styles.content({ class: normalizeClass(attrs.class) }) }"
            >
                <Popover.Arrow :class="styles.arrow()">
                    <Popover.ArrowTip :class="styles.arrowTip()" />
                </Popover.Arrow>
                <Popover.Title :id="titleId" :class="styles.title()">{{ title }}</Popover.Title>
                <Popover.Description v-if="description" :id="descriptionId" :class="styles.description()">
                    {{ description }}
                </Popover.Description>
                <div v-if="$slots.default" :class="styles.body()"><slot /></div>
                <Popover.CloseTrigger
                    v-if="closable"
                    :class="styles.close()"
                    :aria-label="closeLabel ?? translations.common.close"
                >
                    <X :class="styles.closeIcon()" aria-hidden="true" />
                </Popover.CloseTrigger>
            </Popover.Content>
        </Popover.Positioner>
    </Teleport>
</template>
