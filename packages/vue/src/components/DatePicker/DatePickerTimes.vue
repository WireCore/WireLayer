<script setup lang="ts">
import { DateInput } from '@ark-ui/vue/date-input';
import { DatePicker, type DateValue } from '@ark-ui/vue/date-picker';
import { DateFormatter } from '@internationalized/date';
import { datePicker as datePickerRecipe } from '@wirecore/wirelayer-recipes';
import { computed, useId, useTemplateRef } from 'vue';
import DateSegments from './DateSegments.vue';
import { useDateAnnouncements } from './announcements.js';
import { fromTime, toTime } from './dates.js';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

const translations = useTranslations();

const props = defineProps<{
    /** One time per date: 1, or 2 for start and end of a range */
    count: number;
    /** The time of a date ("HH:mm") */
    timeOf: (index: number) => string;
    dates: DateValue[];
    min?: DateValue;
    max?: DateValue;
    locale: string;
    /** Short zone name after the times and the id of its long name */
    zone?: { short: string; describedby: string };
}>();
const emit = defineEmits<{ time: [index: number, time: string] }>();
const datePicker = useRecipe('datePicker', datePickerRecipe);
const styles = datePicker();
const field = datePicker({ size: 'sm' });
const id = useId();
const root = useTemplateRef<HTMLElement>('root');
useDateAnnouncements(() => root.value);
const range = computed(() => props.count > 1);
const names = [translations.dateRange.start, translations.dateRange.end];
const indexes = computed(() => Array.from({ length: props.count }, (_, index) => index));
const formatter = computed(() => new DateFormatter(props.locale, { hour: '2-digit', minute: '2-digit' }));

// On the day of min/max the time is limited to it
const isoDay = (date: DateValue | undefined) => date?.toString().slice(0, 10);
function limit(bound: DateValue | undefined, index: number) {
    const time = isoDay(bound) === isoDay(props.dates[index]) ? toTime(bound) : null;
    return time ? fromTime(time) : undefined;
}
// Fixed values per time: a new literal in the template on every render makes Ark update the machine
const values = computed(() => indexes.value.map((index) => [fromTime(props.timeOf(index))]));
const bounds = computed(() =>
    indexes.value.map((index) => ({ min: limit(props.min, index), max: limit(props.max, index) }))
);
function change(index: number, value: DateValue[]) {
    const time = toTime(value[0]);
    if (time && time !== props.timeOf(index)) emit('time', index, time);
}
</script>

<template>
    <!--
        Hour and minute below the calendar (withTime): one field per date – "Start" and "End" in a range – typed or
        changed with the arrow keys, and "Done". On the day of min/max the time is limited to it
    -->
    <div ref="root" :class="styles.timeSection()" v-bind="range ? { role: 'group', 'aria-labelledby': `${id}h` } : {}">
        <!-- One date: the field itself is named "Time" -->
        <span :id="`${id}h`" :class="styles.timeHeading()" :aria-hidden="range ? undefined : 'true'">
            {{ translations.calendar.time }}
        </span>
        <div v-for="index in indexes" :key="index" :class="styles.timeField()">
            <span v-if="range" :class="styles.timeFieldLabel()" aria-hidden="true">{{ names[index] }}</span>
            <div :class="field.control()">
                <DateInput.Root
                    :class="field.dateInput()"
                    :model-value="values[index]"
                    granularity="minute"
                    :formatter="formatter"
                    :min="bounds[index]!.min"
                    :max="bounds[index]!.max"
                    :locale="locale"
                    should-force-leading-zeros
                    :translations="translations.dateInput"
                    @value-change="change(index, $event.value)"
                >
                    <DateInput.Control :class="field.dateControl()">
                        <DateSegments
                            :index="0"
                            :label="range ? names[index] : translations.calendar.time"
                            :describedby="zone?.describedby"
                            size="sm"
                        />
                    </DateInput.Control>
                </DateInput.Root>
            </div>
        </div>
        <span v-if="zone" :class="styles.timeZone()" aria-hidden="true">{{ zone.short }}</span>
        <DatePicker.Context v-slot="api">
            <button
                type="button"
                :class="styles.buttonBarButton({ class: styles.timeDone() })"
                @click="api.setOpen(false)"
            >
                {{ translations.calendar.done }}
            </button>
        </DatePicker.Context>
    </div>
</template>
