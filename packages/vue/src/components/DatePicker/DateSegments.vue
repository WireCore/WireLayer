<script setup lang="ts">
import { DateInput } from '@ark-ui/vue/date-input';
import { datePicker as datePickerRecipe } from '@wirecore/wirelayer-recipes';
import { computed } from 'vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

const translations = useTranslations();

const props = defineProps<{
    index: number;
    label?: string;
    describedby?: string;
    /** Own reading of pasted text – true when it was a date (Ark then does nothing) */
    paste?: (text: string, index: number) => boolean;
    size?: 'sm' | 'md' | 'lg';
}>();
function onPaste(event: ClipboardEvent) {
    const text = event.clipboardData?.getData('text/plain') ?? '';
    if (!props.paste?.(text, props.index)) return;
    event.preventDefault();
    event.stopPropagation();
}
const datePicker = useRecipe('datePicker', datePickerRecipe);
const styles = computed(() => datePicker({ size: props.size }));
</script>

<template>
    <!-- One date of the field as spin buttons per part; Ark names the parts in English ("day") -->
    <DateInput.SegmentGroup
        :index="index"
        :class="styles.segments()"
        :aria-label="label"
        :aria-describedby="describedby"
        v-bind="paste ? { onPasteCapture: onPaste } : {}"
    >
        <DateInput.Context v-slot="api">
            <DateInput.Segment
                v-for="(segment, position) in api.getSegments({ index })"
                :key="position"
                :segment="segment"
                :class="styles.segment()"
                :aria-label="translations.dateSegments[segment.type]"
            />
        </DateInput.Context>
    </DateInput.SegmentGroup>
</template>
