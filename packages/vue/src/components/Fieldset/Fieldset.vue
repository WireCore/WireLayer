<script setup lang="ts">
import { Fieldset } from '@ark-ui/vue/fieldset';
import { ChevronRight } from '@lucide/vue';
import { fieldset as fieldsetRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, ref, useAttrs, useId } from 'vue';
import { useRecipe } from '../../recipes.js';

export interface FieldsetProps {
    legend: string;
    helperText?: string;
    /** Error of the whole group (e.g. "Please choose an option") */
    errorText?: string;
    invalid?: boolean;
    /** Disables every field inside (native fieldset – the legend's toggle stays usable) */
    disabled?: boolean;
    /** The legend becomes a button that shows/hides the fields (aria-expanded) */
    collapsible?: boolean;
    /** Open state of a collapsible fieldset – use with v-model:open */
    open?: boolean;
    defaultOpen?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof fieldsetRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<FieldsetProps>(), {
    helperText: undefined,
    errorText: undefined,
    invalid: false,
    disabled: false,
    collapsible: false,
    open: undefined,
    defaultOpen: true,
});
const emit = defineEmits<{ 'update:open': [open: boolean] }>();
const fieldset = useRecipe('fieldset', fieldsetRecipe, () => props.classes);
const attrs = useAttrs();
const styles = fieldset();
const contentId = useId();
const internal = ref(props.defaultOpen);
const isOpen = computed(() => props.open ?? internal.value);
function toggle() {
    internal.value = !isOpen.value;
    emit('update:open', internal.value);
}
</script>

<template>
    <!-- <fieldset> with <legend>: names the group of fields; help and error text describe it -->
    <Fieldset.Root
        :class="styles.base({ class: normalizeClass(attrs.class) })"
        :style="attrs.style"
        :invalid="invalid"
        :disabled="disabled"
    >
        <Fieldset.Legend :class="styles.legend()">
            <button
                v-if="collapsible"
                type="button"
                :class="styles.trigger()"
                :aria-expanded="isOpen"
                :aria-controls="contentId"
                @click="toggle"
            >
                <ChevronRight
                    :class="styles.indicator()"
                    :data-state="isOpen ? 'open' : 'closed'"
                    aria-hidden="true"
                />{{ legend }}
            </button>
            <template v-else>{{ legend }}</template>
        </Fieldset.Legend>
        <Fieldset.HelperText v-if="helperText" :class="styles.helperText()">{{ helperText }}</Fieldset.HelperText>
        <div v-if="collapsible" :id="contentId" :class="styles.content()" :hidden="!isOpen || undefined">
            <slot />
        </div>
        <slot v-else />
        <Fieldset.ErrorText v-if="errorText" :class="styles.errorText()">{{ errorText }}</Fieldset.ErrorText>
    </Fieldset.Root>
</template>
