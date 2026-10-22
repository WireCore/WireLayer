<script setup lang="ts">
import {
    hotkeyRegistry,
    hotkeysDialog as hotkeysDialogRecipe,
    type HotkeyRegistry,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { computed, ref } from 'vue';
import Dialog from '../Dialog/Dialog.vue';
import DialogContent from '../Dialog/DialogContent.vue';
import Kbd from '../Kbd/Kbd.vue';
import { useHotkeys, useRegisteredHotkeys } from '../../composables/hotkeys.js';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface HotkeysDialogProps {
    /** Open state – use with v-model:open */
    open?: boolean;
    /** Shortcut that opens the dialog (default "?"); `false` switches it off */
    hotkey?: string | false;
    /** Title of the dialog (default "Keyboard shortcuts") */
    title?: string;
    /** Another registry than the page's */
    registry?: HotkeyRegistry;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof hotkeysDialogRecipe>;
}

const props = withDefaults(defineProps<HotkeysDialogProps>(), { open: undefined, hotkey: '?' });
const hotkeysDialog = useRecipe('hotkeysDialog', hotkeysDialogRecipe, () => props.classes);
const emit = defineEmits<{ 'update:open': [open: boolean] }>();
const translations = useTranslations();
const styles = hotkeysDialog();
const internal = ref(false);
const isOpen = computed(() => props.open ?? internal.value);
function setOpen(next: boolean) {
    internal.value = next;
    emit('update:open', next);
}
const registry = props.registry ?? hotkeyRegistry;
useHotkeys(
    () => (props.hotkey ? [[props.hotkey, () => setOpen(!isOpen.value)]] : []),
    () => ({ registry, description: translations.hotkeys.open, group: translations.hotkeys.general })
);
const entries = useRegisteredHotkeys(registry);
// Grouped in the order the groups first appear; entries without a group under "General"
const groups = computed(() => {
    const byGroup = new Map<string, typeof entries.value>();
    for (const entry of entries.value) {
        const group = entry.group ?? translations.hotkeys.general;
        byGroup.set(group, [...(byGroup.get(group) ?? []), entry]);
    }
    return [...byGroup];
});
</script>

<template>
    <!-- Dialog listing the registered shortcuts with their descriptions, grouped; opens with "?" -->
    <Dialog :open="isOpen" @update:open="setOpen">
        <DialogContent :title="title ?? translations.hotkeys.title" scroll-behavior="inside">
            <div :class="styles.base()">
                <div v-for="[group, items] in groups" :key="group" :class="styles.group()">
                    <h3 :class="styles.groupTitle()">{{ group }}</h3>
                    <dl :class="styles.list()">
                        <div v-for="entry in items" :key="entry.id" :class="styles.row()">
                            <dt :class="styles.description()">{{ entry.description }}</dt>
                            <dd :class="styles.keys()"><Kbd :hotkey="entry.hotkey" /></dd>
                        </div>
                    </dl>
                </div>
                <p v-if="!groups.length" :class="styles.empty()">{{ translations.hotkeys.empty }}</p>
            </div>
        </DialogContent>
    </Dialog>
</template>
