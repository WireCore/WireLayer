<script setup lang="ts">
import { DateInput } from '@ark-ui/vue/date-input';
import { DatePicker, type DateValue } from '@ark-ui/vue/date-picker';
import { useFieldContext } from '@ark-ui/vue/field';
import { CalendarDays, X } from '@lucide/vue';
import {
    datePicker as datePickerRecipe,
    localeWeekInfo,
    parsePastedDate,
    parsePastedRange,
    pluralText,
    timeZoneLabel,
    timeZoneLongLabel,
    zonedToInstant,
    type CalendarDayState,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { DateFormatter } from '@internationalized/date';
import { computed, useId } from 'vue';
import DatePickerCalendar from './DatePickerCalendar.vue';
import type { CalendarPreset, CalendarViewOptions } from './DatePickerViews.vue';
import DateSegments from './DateSegments.vue';
import { fromIso, withTimeOf } from './dates.js';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

const translations = useTranslations();

// Shared by DatePicker and DateRangePicker: they convert their ISO strings, this works with date values

const props = defineProps<
    {
        mode: 'single' | 'range' | 'multiple';
        dates: DateValue[];
        withTime: boolean;
        min?: DateValue;
        max?: DateValue;
        isDateUnavailable?: (date: DateValue) => boolean;
        locale: string;
        disabled?: boolean;
        readOnly?: boolean;
        invalid?: boolean;
        required?: boolean;
        name?: string;
        label?: string;
        className?: string;
        /** Month and year only (MonthPicker) or the year only (YearPicker) */
        period?: 'month' | 'year';
        classes?: RecipeClasses<typeof datePickerRecipe>;
        /** Range presets below the calendar */
        presets?: CalendarPreset[];
        size?: 'sm' | 'md' | 'lg';
        /** clearable false: no clear button */
        hideClear?: boolean;
        /** 0 = Sunday … 6; default from the locale */
        firstDayOfWeek?: number;
        /** IANA zone: "today" and the zone label */
        timeZone?: string;
        showTimeZone?: boolean;
        responsive?: boolean;
    } & CalendarViewOptions
>();
defineSlots<{ day?(props: { date: string } & CalendarDayState): unknown }>();
const datePicker = useRecipe('datePicker', datePickerRecipe, () => props.classes);
const emit = defineEmits<{ change: [dates: DateValue[]] }>();
const styles = computed(() => datePicker({ size: props.size }));
const id = useId();

// Ark connects the other inputs to a surrounding Field itself, these not: label, state, description
const field = useFieldContext();
const state = computed(() => ({
    disabled: props.disabled ?? field?.value.disabled,
    readOnly: props.readOnly ?? field?.value.readOnly,
    invalid: props.invalid ?? field?.value.invalid,
    required: props.required ?? field?.value.required,
}));
const range = props.mode === 'range';
const multiple = props.mode === 'multiple';
const inputMode = range ? 'range' : 'single';
const groups = range ? [0, 1] : [0];
const rangeNames = [translations.dateRange.start, translations.dateRange.end];
// The field label names the date; in a range followed by "Start"/"End"
const ids = computed(() =>
    field?.value
        ? { label: (index: number) => (range ? `${field.value.ids.label} ${id}r${index}` : field.value.ids.label) }
        : undefined
);
const groupLabel = (index: number) =>
    field?.value ? undefined : range ? [props.label, rangeNames[index]].filter(Boolean).join(', ') : props.label;
const calendarTranslations = range
    ? { ...translations.datePicker, clearTrigger: translations.dateRange.clearTrigger }
    : translations.datePicker;

// MonthPicker and YearPicker: the field has month and year (or the year) only, the calendar starts (and stops)
// at the months (years)
const periodFormatter = computed(() =>
    props.period
        ? new DateFormatter(
              props.locale,
              props.period === 'month' ? { month: '2-digit', year: 'numeric' } : { year: 'numeric' }
          )
        : undefined
);
const startOfWeek = computed(() => props.firstDayOfWeek ?? localeWeekInfo(props.locale).firstDay);

// Zone label after the time: short name visible, long name for screen readers
const zone = computed(() => {
    if (!props.showTimeZone || !props.timeZone) return undefined;
    const date = props.dates[0];
    const instant = date ? zonedToInstant(date.toString().slice(0, 16), props.timeZone) : new Date();
    return {
        short: timeZoneLabel(props.timeZone, props.locale, instant),
        long: translations.calendar.timeZone(timeZoneLongLabel(props.timeZone, props.locale, instant)),
    };
});
const describedby = computed(
    () => [field?.value.ariaDescribedby, zone.value ? `${id}tz` : undefined].filter(Boolean).join(' ') || undefined
);

// Several dates (selectionMode multiple): the field shows them as text
const multipleText = computed(() => {
    if (!props.dates.length) return translations.calendar.noDates;
    if (props.dates.length > 3)
        return pluralText(translations.calendar.datesSelected, props.dates.length, props.locale);
    const formatter = new DateFormatter(props.locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'UTC',
    });
    return props.dates.map((date) => formatter.format(date.toDate('UTC'))).join(', ');
});

const calendarOptions = computed(() => ({
    presets: props.presets,
    showWeekNumbers: props.showWeekNumbers,
    numberOfMonths: props.numberOfMonths,
    showButtonBar: props.showButtonBar,
    plainToday: props.plainToday,
    hideOutsideDays: props.hideOutsideDays,
    weekendDays: props.weekendDays,
    allowDeselect: props.allowDeselect,
    timeZone: props.timeZone,
    responsive: props.responsive,
}));

// A day picked in the calendar keeps the time already typed
function fromCalendar(next: DateValue[]) {
    emit('change', props.withTime ? next.map((day, index) => withTimeOf(day, props.dates[index])) : next);
}

// Pasting "20.10.2026", "2026-10-20" or "20.10.2026 – 24.10.2026" fills the field (Ark itself reads ISO only)
function pasteText(text: string, index: number): boolean {
    if (props.period) return false;
    if (range) {
        const both = parsePastedRange(text, props.locale, props.withTime);
        if (both) {
            emit('change', [fromIso(both.start, props.withTime), fromIso(both.end, props.withTime)]);
            return true;
        }
    }
    const iso = parsePastedDate(text, props.locale, props.withTime);
    if (!iso) return false;
    const next = [...props.dates];
    next[index] = fromIso(iso, props.withTime);
    emit('change', next.filter(Boolean));
    return true;
}
</script>

<template>
    <!--
        Date field: type the digits one after another ("20102026") – each part jumps to the next and the separators
        come from the locale – or pick from the calendar (arrow keys, Page Up/Down, Home/End).
        A range has two dates (start – end), with time each date gets hour and minute.
    -->
    <DatePicker.Root
        :class="styles.base({ class: className })"
        :model-value="dates"
        :selection-mode="mode"
        :min="min"
        :max="max"
        :is-date-unavailable="isDateUnavailable"
        :locale="locale"
        :start-of-week="startOfWeek"
        :min-view="period"
        :default-view="period"
        :num-of-months="numberOfMonths"
        :time-zone="timeZone"
        v-bind="state"
        :positioning="{ placement: 'bottom-start', gutter: 4 }"
        :translations="calendarTranslations"
        lazy-mount
        unmount-on-exit
        @value-change="fromCalendar($event.value)"
    >
        <DatePicker.Control :class="styles.control()">
            <template v-if="multiple">
                <span :id="`${id}v`" :class="styles.multiValue()" :data-placeholder="dates.length ? undefined : ''">
                    {{ multipleText }}
                </span>
                <template v-if="name">
                    <input
                        v-for="(date, index) in dates"
                        :key="date.toString()"
                        type="hidden"
                        :name="`${name}[${index}]`"
                        :value="date.toString()"
                    />
                </template>
            </template>
            <DateInput.Root
                v-else
                :class="styles.dateInput()"
                :ids="ids"
                :model-value="dates"
                :selection-mode="inputMode"
                :granularity="withTime ? 'minute' : 'day'"
                :formatter="periodFormatter"
                :min="min"
                :max="max"
                :is-date-unavailable="isDateUnavailable"
                :locale="locale"
                should-force-leading-zeros
                :name="name"
                v-bind="state"
                :translations="translations.dateInput"
                @value-change="emit('change', $event.value)"
            >
                <DateInput.Control :class="styles.dateControl()">
                    <template v-for="index in groups" :key="index">
                        <span v-if="index === 1" :class="styles.rangeSeparator()" aria-hidden="true">–</span>
                        <span v-if="range && field" :id="`${id}r${index}`" :class="styles.rangeLabel()">
                            {{ rangeNames[index] }}
                        </span>
                        <DateSegments
                            :index="index"
                            :label="groupLabel(index)"
                            :describedby="describedby"
                            :paste="period ? undefined : pasteText"
                            :size="size"
                        />
                    </template>
                </DateInput.Control>
                <DateInput.HiddenInput v-for="index in groups" :key="index" :index="index" />
            </DateInput.Root>
            <template v-if="zone">
                <span :class="styles.timeZone()" aria-hidden="true">{{ zone.short }}</span>
                <span :id="`${id}tz`" hidden>{{ zone.long }}</span>
            </template>
            <DatePicker.ClearTrigger v-if="!hideClear" :class="styles.clear()">
                <X :class="styles.clearIcon()" aria-hidden="true" />
            </DatePicker.ClearTrigger>
            <DatePicker.Trigger :class="styles.trigger()" v-bind="multiple ? { 'aria-describedby': `${id}v` } : {}">
                <CalendarDays :class="styles.triggerIcon()" aria-hidden="true" />
            </DatePicker.Trigger>
        </DatePicker.Control>
        <DatePickerCalendar v-bind="calendarOptions">
            <template v-if="$slots.day" #day="dayState"><slot name="day" v-bind="dayState" /></template>
        </DatePickerCalendar>
    </DatePicker.Root>
</template>
