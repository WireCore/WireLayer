<script setup lang="ts">
import { useLandmarks } from '../../composables/hotkeys.js';

export interface LandmarkNavigationProps {
    /** Which elements count as landmarks (default: header, nav, main, aside, footer, named regions, search, [data-landmark]) */
    selector?: string;
    /** Key that jumps forward; with Shift backward (default F6) */
    keyName?: string;
    /** Switched off for now */
    disabled?: boolean;
}

const props = defineProps<LandmarkNavigationProps>();
useLandmarks(() => ({ selector: props.selector, key: props.keyName, enabled: !props.disabled }));
</script>

<template>
    <!-- Renders nothing itself: F6 / Shift+F6 move the focus between the landmarks of the page while mounted -->
    <slot />
</template>
