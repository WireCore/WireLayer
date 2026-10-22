<script setup lang="ts">
import { DatePicker } from '@ark-ui/vue/date-picker';
import { datePicker as datePickerRecipe, type CalendarDayState } from '@wirecore/wirelayer-recipes';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import DatePickerViews, { type CalendarPreset, type CalendarViewOptions } from './DatePickerViews.vue';
import { useRecipe } from '../../recipes.js';

const props = defineProps<{ presets?: CalendarPreset[]; responsive?: boolean } & CalendarViewOptions>();
defineSlots<{ day?(props: { date: string } & CalendarDayState): unknown }>();
const datePicker = useRecipe('datePicker', datePickerRecipe);
const styles = datePicker();
const views = computed<{ presets?: CalendarPreset[] } & CalendarViewOptions>(() => ({
    presets: props.presets,
    showWeekNumbers: props.showWeekNumbers,
    numberOfMonths: props.numberOfMonths,
    showButtonBar: props.showButtonBar,
    plainToday: props.plainToday,
    hideOutsideDays: props.hideOutsideDays,
    weekendDays: props.weekendDays,
    allowDeselect: props.allowDeselect,
    timeZone: props.timeZone,
}));
const multiMonth = computed(() => (props.numberOfMonths ?? 1) > 1);

// responsive: on narrow screens the calendar is a sheet at the bottom (decided in the browser only)
const narrow = ref(false);
let query: MediaQueryList | undefined;
const update = () => (narrow.value = !!query?.matches);
onMounted(() => {
    if (!props.responsive || typeof window.matchMedia !== 'function') return;
    query = window.matchMedia('(max-width: 639.98px)');
    update();
    query.addEventListener('change', update);
});
onBeforeUnmount(() => query?.removeEventListener('change', update));
</script>

<template>
    <!-- Calendar popup -->
    <Teleport to="body">
        <template v-if="narrow">
            <DatePicker.Context v-slot="api">
                <div v-if="api.open" :class="styles.backdrop()" aria-hidden="true" />
            </DatePicker.Context>
            <div :class="styles.sheet()">
                <DatePicker.Content :class="datePicker({ multiMonth, bottomSheet: true }).content()">
                    <DatePickerViews v-bind="views">
                        <template v-if="$slots.day" #day="state"><slot name="day" v-bind="state" /></template>
                    </DatePickerViews>
                </DatePicker.Content>
            </div>
        </template>
        <DatePicker.Positioner v-else>
            <DatePicker.Content :class="multiMonth ? datePicker({ multiMonth }).content() : styles.content()">
                <DatePickerViews v-bind="views">
                    <template v-if="$slots.day" #day="state"><slot name="day" v-bind="state" /></template>
                </DatePickerViews>
            </DatePicker.Content>
        </DatePicker.Positioner>
    </Teleport>
</template>
