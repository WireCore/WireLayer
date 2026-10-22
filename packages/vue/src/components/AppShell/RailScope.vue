<script setup lang="ts">
import { computed, provide } from 'vue';
import { appShellRailKey } from './context.js';

// Gives the navbar content its rail state (the drawer copy never is a rail)
const props = defineProps<{ rail: boolean; expandOnHover: boolean }>();
provide(
    appShellRailKey,
    computed(() => ({ rail: props.rail, expandOnHover: props.expandOnHover }))
);
</script>

<template>
    <slot />
</template>
