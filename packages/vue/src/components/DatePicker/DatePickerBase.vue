<script setup lang="ts">
import { DateInput, type UseDateInputContext } from '@ark-ui/vue/date-input';
import { DatePicker, type DateValue } from '@ark-ui/vue/date-picker';
import { useFieldContext } from '@ark-ui/vue/field';
import { CalendarDays, X } from '@lucide/vue';
import {
    datePicker as datePickerRecipe,
    localeWeekInfo,
    parsePastedDate,
    parsePastedRange,
    partialDateIndex,
    pluralText,
    timeZoneLabel,
    timeZoneLongLabel,
    zonedToInstant,
    type CalendarDayState,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { DateFormatter } from '@internationalized/date';
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, useId, useTemplateRef, watch } from 'vue';
import DatePickerCalendar from './DatePickerCalendar.vue';
import DatePickerTimes from './DatePickerTimes.vue';
import type { CalendarPreset, CalendarViewOptions } from './DatePickerViews.vue';
import DateSegments from './DateSegments.vue';
import { useDateAnnouncements } from './announcements.js';
import { atTime, fromIso, toTime, withTimeOf } from './dates.js';
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
        /** Own id of the field: the (first) date gets it */
        ownId?: string;
        /** Text of the empty field, shown until it gets the focus */
        placeholder?: string;
        className?: string;
        /** Month and year only (MonthPicker) or the year only (YearPicker) */
        period?: 'month' | 'year';
        classes?: RecipeClasses<typeof datePickerRecipe>;
        /** Range presets below the calendar */
        presets?: readonly CalendarPreset[];
        size?: 'sm' | 'md' | 'lg';
        /** clearable false: no clear button */
        hideClear?: boolean;
        /** 0 = Sunday … 6; default from the locale */
        firstDayOfWeek?: number;
        /** IANA zone: "today" and the zone label */
        timeZone?: string;
        showTimeZone?: boolean;
        responsive?: boolean;
        /** withTime: hour and minute below the calendar as well; false: in the field only */
        timeInPopup?: boolean;
    } & CalendarViewOptions
>();
defineSlots<{ day?(props: { date: string } & CalendarDayState): unknown }>();
const datePicker = useRecipe('datePicker', datePickerRecipe, () => props.classes);
const emit = defineEmits<{ change: [dates: DateValue[]] }>();
const styles = computed(() => datePicker({ size: props.size }));
const id = useId();
const root = useTemplateRef<{ $el: Element }>('root');
useDateAnnouncements(() => root.value?.$el);

// A date with some parts typed and others empty is no value: the field reports the dates before it (none for a single
// date), so a required field fails, and keeps showing what was typed – the segmented input keeps the last value
// (`held`), Ark would empty the parts otherwise. Completing the date reports it again.
const held = shallowRef<DateValue[] | null>(null);
let reported: DateValue[] = [];
const sameDates = (a: readonly DateValue[], b: readonly DateValue[]) =>
    a.length === b.length && a.every((date, index) => date.toString() === b[index]?.toString());
watch(
    () => props.dates,
    (dates) => {
        if (held.value && !sameDates(dates, reported)) held.value = null;
    }
);
function change(next: DateValue[]) {
    held.value = null;
    emit('change', next);
}
function checkPartial(element: Element | null) {
    const index = partialDateIndex(element);
    if (index >= 0) {
        if (props.dates.length <= index) return;
        held.value = held.value ?? props.dates;
        reported = props.dates.slice(0, index);
        emit('change', reported);
    } else if (held.value) {
        // Complete again with the date it had – Ark reports no change then
        change(held.value);
    }
}
// After Ark has handled the key (or the field was left)
const onPartsChange = (event: Event) => {
    const element = event.currentTarget as Element | null;
    setTimeout(() => checkPartial(element));
};

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
// The field label names the date; in a range followed by "Start"/"End". An own id goes to the (first) date through
// Ark – undefined leaves Ark its own id
const ids = computed(() => {
    const own = props.ownId;
    const label = field?.value
        ? { label: (index: number) => (range ? `${field.value.ids.label} ${id}r${index}` : field.value.ids.label) }
        : {};
    const segmentGroup = own ? { segmentGroup: (index: number) => (index === 0 ? own : undefined) as string } : {};
    return field?.value || own ? { ...label, ...segmentGroup } : undefined;
});
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

// Own placeholder: while no part is typed (a part alone is no value yet) and the field has no focus. It describes
// the parts – also while they show, for the screen reader reads the description on focus
type DateInputApi = UseDateInputContext['value'];
const empty = (api: DateInputApi) =>
    groups.every((index) =>
        api.getSegments({ index }).every((segment) => segment.type === 'literal' || segment.isPlaceholder)
    );
const placeholderShown = (api: DateInputApi) => !!props.placeholder && empty(api) && !api.focused;
const describedbyOf = (api: DateInputApi) =>
    props.placeholder && empty(api) ? [describedby.value, `${id}ph`].filter(Boolean).join(' ') : describedby.value;

// Several dates (selectionMode multiple): the field shows them as text
const multipleText = computed(() => {
    if (!props.dates.length) return props.placeholder ?? translations.calendar.noDates;
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

// Time in the popup (one date or a range): picking a day keeps the calendar open, Escape discards
const popupTime = computed(() => props.withTime && !!props.timeInPopup && !multiple && !props.period);
// The last time of each date. A day picked in the calendar keeps it – also the end of a range: a new range starts
// with the start alone, so the end has no time of its own until it is picked. A time set in the popup before its day
// waits here. Without one: start 00:00, end 23:59
const times = ref<(string | undefined)[]>([]);
watch(
    () => props.dates,
    (dates) =>
        dates.forEach((date, index) => {
            const time = toTime(date);
            if (time) times.value[index] = time;
        }),
    { immediate: true }
);
const timeOf = (index: number) => times.value[index] ?? (range && index === 1 ? '23:59' : '00:00');
function fromCalendar(next: DateValue[]) {
    if (!props.withTime) return change(next);
    if (multiple) return change(next.map((day, index) => withTimeOf(day, props.dates[index])));
    change(next.map((day, index) => atTime(day, timeOf(index))));
}
function setTime(index: number, time: string) {
    times.value[index] = time;
    const date = props.dates[index];
    if (!date) return;
    const next = [...props.dates];
    next[index] = atTime(date, time);
    change(next);
}
const popupZone = computed(() => (zone.value ? { short: zone.value.short, describedby: `${id}tz` } : undefined));
// Escape discards what changed in the popup since it opened (Ark closes it right after)
let opened: { dates: DateValue[]; times: (string | undefined)[] } | null = null;
function onOpenChange(open: boolean) {
    opened = open ? { dates: props.dates, times: [...times.value] } : null;
}
function onKey(event: KeyboardEvent) {
    if (event.key !== 'Escape' || !popupTime.value || !opened) return;
    times.value = [...opened.times];
    change(opened.dates);
}
onMounted(() => document.addEventListener('keydown', onKey, true));
onBeforeUnmount(() => document.removeEventListener('keydown', onKey, true));

// Pasting "20.10.2026", "2026-10-20" or "20.10.2026 – 24.10.2026" fills the field (Ark itself reads ISO only)
function pasteText(text: string, index: number): boolean {
    if (props.period) return false;
    if (range) {
        const both = parsePastedRange(text, props.locale, props.withTime);
        if (both) {
            change([fromIso(both.start, props.withTime), fromIso(both.end, props.withTime)]);
            return true;
        }
    }
    const iso = parsePastedDate(text, props.locale, props.withTime);
    if (!iso) return false;
    const next = [...props.dates];
    next[index] = fromIso(iso, props.withTime);
    change(next.filter(Boolean));
    return true;
}
// Fixed objects: a new literal in the template on every render makes Ark update the machine, which can re-render
// endlessly (Vue only stops it in development)
const bottomStartPositioning = { placement: 'bottom-start', gutter: 4 } as const;
</script>

<template>
    <!--
        Date field: type the digits one after another ("20102026") – each part jumps to the next and the separators
        come from the locale – or pick from the calendar (arrow keys, Page Up/Down, Home/End).
        A range has two dates (start – end), with time each date gets hour and minute.
    -->
    <DatePicker.Root
        ref="root"
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
        :positioning="bottomStartPositioning"
        :translations="calendarTranslations"
        :close-on-select="!popupTime"
        lazy-mount
        unmount-on-exit
        @value-change="fromCalendar($event.value)"
        @open-change="onOpenChange($event.open)"
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
                :model-value="held ?? dates"
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
                @value-change="change($event.value)"
                @keyup="onPartsChange"
                @focusout="onPartsChange"
            >
                <DateInput.Context v-slot="api">
                    <DateInput.Control
                        :class="styles.dateControl()"
                        :data-placeholder-shown="placeholderShown(api) || undefined"
                    >
                        <template v-for="index in groups" :key="index">
                            <span v-if="index === 1" :class="styles.rangeSeparator()" aria-hidden="true">–</span>
                            <span v-if="range && field" :id="`${id}r${index}`" :class="styles.rangeLabel()">
                                {{ rangeNames[index] }}
                            </span>
                            <DateSegments
                                :index="index"
                                :label="groupLabel(index)"
                                :describedby="describedbyOf(api)"
                                :paste="period ? undefined : pasteText"
                                :size="size"
                            />
                        </template>
                    </DateInput.Control>
                    <!-- Stays while focused (hidden): the parts keep their description -->
                    <span
                        v-if="placeholder && empty(api)"
                        :id="`${id}ph`"
                        :class="styles.placeholder()"
                        :data-hidden="placeholderShown(api) ? undefined : ''"
                        @click="api.focus()"
                    >
                        {{ placeholder }}
                    </span>
                </DateInput.Context>
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
            <template v-if="popupTime" #default>
                <DatePickerTimes
                    :count="groups.length"
                    :time-of="timeOf"
                    :dates="dates"
                    :min="min"
                    :max="max"
                    :locale="locale"
                    :zone="popupZone"
                    @time="setTime"
                />
            </template>
        </DatePickerCalendar>
    </DatePicker.Root>
</template>
