<script setup lang="ts" generic="T extends string | Date | null = string | null">
import { ChevronLeft, ChevronRight } from '@lucide/vue';
import {
    addIsoDays,
    dayStrip,
    fromWallIso,
    localeWeekInfo,
    miniCalendar as miniCalendarRecipe,
    startOfIsoWeekRow,
    todayIso,
    toWallIso,
    type DateLike,
    type DateValueType,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { computed, nextTick, ref, useAttrs } from 'vue';
import { splitAttrs } from '../../utils/attrs.js';
import { useLocale, useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface MiniCalendarProps<T extends string | Date | null = string | null> {
    /** Chosen day (ISO "2026-10-20" or Date) – use with v-model */
    modelValue?: T;
    defaultValue?: T;
    /** What v-model gets: an ISO string (default) or a Date */
    valueType?: DateValueType;
    /** First day shown at the start (default: the start of the week of the value or today) */
    startDate?: DateLike;
    /** Number of days in the strip */
    days?: number;
    /** Earliest day that can be chosen */
    min?: DateLike;
    /** Latest day that can be chosen */
    max?: DateLike;
    /** Days that cannot be chosen – receives the ISO date */
    isDateUnavailable?: (date: string) => boolean;
    /** First day of the week for the start: 0 = Sunday … 6; default from the locale */
    firstDayOfWeek?: number;
    /** Day names and the spoken dates follow the locale */
    locale?: string;
    /** Name of the strip (default "Days") */
    label?: string;
    disabled?: boolean;
    /** Extra classes per part of the component, e.g. { day: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof miniCalendarRecipe>;
}

defineOptions({ inheritAttrs: false });
const localeContext = useLocale();
const translations = useTranslations();
const props = withDefaults(defineProps<MiniCalendarProps<T>>(), {
    modelValue: undefined,
    defaultValue: undefined,
    valueType: 'string',
    days: 7,
});
const emit = defineEmits<{ 'update:modelValue': [value: T] }>();
const miniCalendar = useRecipe('miniCalendar', miniCalendarRecipe, () => props.classes);
const styles = miniCalendar();
const currentLocale = computed(() => props.locale ?? localeContext.value.locale);
const attrs = useAttrs();
const split = computed(() => splitAttrs(attrs));

const internal = ref<DateLike | null>(props.defaultValue ?? null);
const current = computed(() => toWallIso(props.modelValue === undefined ? internal.value : props.modelValue, false));
const today = todayIso();
const firstDay = computed(() => props.firstDayOfWeek ?? localeWeekInfo(currentLocale.value).firstDay);
const start = ref(
    toWallIso(props.startDate, false) ??
        (props.days === 7 ? startOfIsoWeekRow(current.value ?? today, firstDay.value) : (current.value ?? today))
);
const min = computed(() => toWallIso(props.min, false));
const max = computed(() => toWallIso(props.max, false));
const strip = computed(() => dayStrip(start.value, props.days));
const unavailable = (iso: string) =>
    !!props.disabled ||
    (!!min.value && iso < min.value) ||
    (!!max.value && iso > max.value) ||
    !!props.isDateUnavailable?.(iso);

const format = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(currentLocale.value, { ...options, timeZone: 'UTC' });
const weekdayFormat = computed(() => format({ weekday: 'short' }));
const nameFormat = computed(() => format({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
const asDate = (iso: string) => new Date(`${iso}T00:00Z`);

function choose(iso: string) {
    if (unavailable(iso) || iso === current.value) return;
    const value = fromWallIso(iso, { valueType: props.valueType });
    internal.value = value;
    emit('update:modelValue', value as T);
}
// One day in the tab order: the chosen one, else today, else the first that can be chosen
const tabDay = computed(() => {
    const candidates = [current.value, today].filter((day) => day && strip.value.includes(day) && !unavailable(day));
    return candidates[0] ?? strip.value.find((day) => !unavailable(day));
});
const buttons = ref<HTMLButtonElement[]>([]);
function page(direction: 1 | -1) {
    start.value = addIsoDays(start.value, direction * props.days);
}
// Arrow keys choose the next or previous day (like radio buttons) and move the strip at its ends
async function onKeydown(event: KeyboardEvent, iso: string) {
    const rtl = getComputedStyle(event.currentTarget as Element).direction === 'rtl';
    const steps: Record<string, number> = {
        ArrowRight: rtl ? -1 : 1,
        ArrowLeft: rtl ? 1 : -1,
        ArrowDown: 1,
        ArrowUp: -1,
    };
    let target: string | undefined;
    if (steps[event.key] !== undefined) {
        target = iso;
        do target = addIsoDays(target, steps[event.key]!);
        while (unavailable(target) && Math.abs(Date.parse(target) - Date.parse(iso)) < 366 * 86_400_000);
        if (unavailable(target)) return;
    } else if (event.key === 'Home') target = strip.value.find((day) => !unavailable(day));
    else if (event.key === 'End') target = [...strip.value].reverse().find((day) => !unavailable(day));
    if (!target) return;
    event.preventDefault();
    if (target < start.value) start.value = target;
    else if (!strip.value.includes(target)) start.value = addIsoDays(target, 1 - props.days);
    choose(target);
    await nextTick();
    buttons.value.find((button) => button.dataset.value === target)?.focus();
}
</script>

<template>
    <!-- Days in a row with arrows to earlier and later days; arrow keys choose a day and move the row on -->
    <div :class="styles.base({ class: split.className })" :style="split.style">
        <button
            type="button"
            :class="styles.nav()"
            :aria-label="translations.miniCalendar.previous"
            :disabled="disabled || (!!min && addIsoDays(start, -1) < min)"
            @click="page(-1)"
        >
            <ChevronLeft :class="styles.navIcon()" aria-hidden="true" />
        </button>
        <div
            role="radiogroup"
            :class="styles.days()"
            :aria-label="label ?? (split.rest['aria-label'] as string | undefined) ?? translations.miniCalendar.label"
        >
            <button
                v-for="day in strip"
                :key="day"
                ref="buttons"
                type="button"
                role="radio"
                :class="styles.day()"
                :data-value="day"
                :tabindex="day === tabDay ? 0 : -1"
                :aria-checked="day === current"
                :aria-label="nameFormat.format(asDate(day))"
                :aria-current="day === today ? 'date' : undefined"
                :aria-disabled="unavailable(day) || undefined"
                :data-today="day === today || undefined"
                @click="choose(day)"
                @keydown="onKeydown($event, day)"
            >
                <span :class="styles.weekday()" aria-hidden="true">{{ weekdayFormat.format(asDate(day)) }}</span>
                <span :class="styles.dayNumber()" aria-hidden="true">{{ Number(day.slice(8)) }}</span>
            </button>
        </div>
        <button
            type="button"
            :class="styles.nav()"
            :aria-label="translations.miniCalendar.next"
            :disabled="disabled || (!!max && addIsoDays(start, days) > max)"
            @click="page(1)"
        >
            <ChevronRight :class="styles.navIcon()" aria-hidden="true" />
        </button>
    </div>
</template>
