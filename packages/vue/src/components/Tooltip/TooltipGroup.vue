<script setup lang="ts">
import { onBeforeUnmount, provide, ref } from 'vue';
import { tooltipGroupKey } from './context.js';

export interface TooltipGroupProps {
    /** Delay before the first tooltip of the group opens (ms) */
    openDelay?: number;
    /** Delay before a tooltip closes (ms) */
    closeDelay?: number;
    /** How long after a tooltip closed the next one opens without delay (ms) – moving along a toolbar */
    skipDelay?: number;
}

const props = withDefaults(defineProps<TooltipGroupProps>(), { openDelay: 400, closeDelay: 150, skipDelay: 300 });
const instant = ref(false);
let timer: ReturnType<typeof setTimeout> | undefined;
provide(tooltipGroupKey, {
    openDelay: () => props.openDelay,
    closeDelay: () => props.closeDelay,
    instant,
    closed: () => {
        instant.value = true;
        clearTimeout(timer);
        timer = setTimeout(() => (instant.value = false), props.skipDelay);
    },
});
onBeforeUnmount(() => clearTimeout(timer));
</script>

<template>
    <!-- Groups tooltips (e.g. of a toolbar): after the first one, the next opens without waiting. No element of its own -->
    <slot />
</template>
