<script setup lang="ts">
// Internal: loading spinner, clear button and status icon at the end of a text control
import { CircleAlert, CircleCheck, LoaderCircle, X } from '@lucide/vue';

defineProps<{
    loading?: boolean;
    /** Shows the clear button (clearable and not empty) */
    clear?: boolean;
    clearLabel: string;
    invalid?: boolean;
    success?: boolean;
    /** Show the invalid icon (Input does; the boxed controls mark invalid by the border only) */
    invalidIcon?: boolean;
    classes: { spinner: string; clear: string; clearIcon: string; statusIcon: string };
}>();
const emit = defineEmits<{ clear: [] }>();
</script>

<template>
    <LoaderCircle v-if="loading" :class="classes.spinner" aria-hidden="true" />
    <!-- Not a tab stop: the usual editing keys delete the text, too -->
    <button
        v-if="clear"
        type="button"
        tabindex="-1"
        :class="classes.clear"
        :aria-label="clearLabel"
        @click="emit('clear')"
    >
        <X :class="classes.clearIcon" aria-hidden="true" />
    </button>
    <CircleAlert v-if="invalid && invalidIcon" :class="classes.statusIcon" aria-hidden="true" />
    <CircleCheck v-else-if="success && !invalid" :class="classes.statusIcon" aria-hidden="true" />
</template>
