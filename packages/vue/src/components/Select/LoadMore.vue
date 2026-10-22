<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

// Invisible end of an option list: scrolled into view (hasMore, not loading), it asks for the next page. Observes
// again after each page, so a short page that leaves the end visible loads the next one, too.
const props = defineProps<{
    /** Asks only while more items exist and none are loading */
    active: boolean;
    /** Number of items – a change observes again */
    count: number;
}>();
const emit = defineEmits<{ load: [] }>();
const element = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | undefined;

function observe() {
    observer?.disconnect();
    // Mounted only in the browser; jsdom and old browsers have no IntersectionObserver
    if (!props.active || !element.value || typeof IntersectionObserver === 'undefined') return;
    observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) emit('load');
    });
    observer.observe(element.value);
}
onMounted(observe);
watch(() => [props.active, props.count], observe);
onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
    <div ref="element" aria-hidden="true" />
</template>
