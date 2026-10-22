<script setup lang="ts">
import { DateInput } from '@ark-ui/vue/date-input';
import { useFieldContext } from '@ark-ui/vue/field';
import { createListCollection, Select } from '@ark-ui/vue/select';
import { DateFormatter, type DateValue } from '@internationalized/date';
import { Check, Clock, X } from '@lucide/vue';
import {
    datePicker as datePickerRecipe,
    formatTime,
    parseTimeText,
    timeWithZoneOffset,
    timeZoneLabel,
    timeZoneLongLabel,
    todayIso,
    zonedTime,
    zonedToInstant,
    type RecipeClasses,
    select as selectRecipe,
} from '@wirecore/wirelayer-recipes';
import { computed, ref, useAttrs, useId } from 'vue';
import { splitAttrs } from '../../utils/attrs.js';
import DateSegments from '../DatePicker/DateSegments.vue';
import { fromTime, timeSlots, toTime } from '../DatePicker/dates.js';
import { useLocale, useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

const localeContext = useLocale();
const translations = useTranslations();

/** A time in the list: "HH:mm" or with its own label ("12:00", "Noon") */
export type TimeOption = string | { value: string; label: string };

export interface TimePickerProps {
    /** "HH:mm", e.g. "14:30" ("HH:mm:ss" with withSeconds) – use with v-model; with timeZone "14:30+02:00" */
    modelValue?: string | null;
    defaultValue?: string | null;
    /** Earliest time ("HH:mm") – also the start of the list */
    min?: string;
    /** Latest time ("HH:mm") – also the end of the list */
    max?: string;
    /** Minutes between the times in the list */
    step?: number;
    /** Adds seconds to the field and the value ("HH:mm:ss") */
    withSeconds?: boolean;
    /** 12 or 24 hours; default from the locale */
    hourCycle?: 'h12' | 'h23';
    /** Own times for the list instead of every `step` minutes, optionally named */
    options?: TimeOption[];
    /** 24 or 12 hours follow the locale */
    locale?: string;
    disabled?: boolean;
    readOnly?: boolean;
    invalid?: boolean;
    required?: boolean;
    name?: string;
    size?: 'sm' | 'md' | 'lg';
    /** Clear button in the field while it has a value */
    clearable?: boolean;
    /** IANA zone ("Europe/Berlin"): the time is typed in the zone, the value gets its offset ("14:30+02:00") */
    timeZone?: string;
    /** Day whose offset applies with timeZone (ISO, default today) */
    referenceDate?: string;
    /** Short zone name after the time ("CEST") */
    showTimeZone?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof datePickerRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<TimePickerProps>(), {
    modelValue: undefined,
    defaultValue: null,
    min: undefined,
    max: undefined,
    step: 30,
    disabled: undefined,
    readOnly: undefined,
    invalid: undefined,
    required: undefined,
    clearable: true,
});
const datePicker = useRecipe('datePicker', datePickerRecipe, () => props.classes);
const select = useRecipe('select', selectRecipe);
const currentLocale = computed(() => props.locale ?? localeContext.value.locale);
const emit = defineEmits<{ 'update:modelValue': [value: string | null] }>();
const attrs = useAttrs();
const split = computed(() => splitAttrs(attrs));
const styles = computed(() => datePicker({ size: props.size }));
const list = select();
const id = useId();

const field = useFieldContext();
const state = computed(() => ({
    disabled: props.disabled ?? field?.value.disabled,
    readOnly: props.readOnly ?? field?.value.readOnly,
    invalid: props.invalid ?? field?.value.invalid,
    required: props.required ?? field?.value.required,
}));

const internal = ref(props.defaultValue);
const current = computed(() => (props.modelValue === undefined ? internal.value : props.modelValue));
// With timeZone the value carries an offset – the field shows the time in the zone
const wall = computed(() =>
    current.value
        ? props.timeZone
            ? zonedTime(current.value, props.timeZone, props.referenceDate, props.withSeconds)
            : current.value
        : null
);
const times = computed(() => (wall.value ? [fromTime(wall.value)] : []));
function set(time: string | null) {
    const value = time && props.timeZone ? timeWithZoneOffset(time, props.timeZone, props.referenceDate) : time;
    if (value === current.value) return;
    internal.value = value;
    emit('update:modelValue', value);
}

// Only hour and minute (and second): the date input edits a date-time on a fixed day
const formatter = computed(
    () =>
        new DateFormatter(currentLocale.value, {
            hour: '2-digit',
            minute: '2-digit',
            ...(props.withSeconds ? { second: '2-digit' } : {}),
            ...(props.hourCycle ? { hourCycle: props.hourCycle } : {}),
        })
);
const placeholder = fromTime('00:00');
const bounds = computed(() => ({
    min: props.min ? fromTime(props.min) : undefined,
    max: props.max ? fromTime(props.max) : undefined,
}));
const label = (time: string) =>
    props.hourCycle
        ? formatTime(time, currentLocale.value, { hourCycle: props.hourCycle, withSeconds: props.withSeconds })
        : time;
const collection = computed(() =>
    createListCollection({
        items: (props.options ?? timeSlots(props.step, props.min, props.max, props.withSeconds)).map((option) =>
            typeof option === 'string' ? { value: option, label: label(option) } : option
        ),
    })
);
const zone = computed(() => {
    if (!props.showTimeZone || !props.timeZone) return undefined;
    const date = props.referenceDate ?? todayIso(props.timeZone);
    const instant = zonedToInstant(`${date}T${wall.value ?? '12:00'}`, props.timeZone);
    return {
        short: timeZoneLabel(props.timeZone, currentLocale.value, instant),
        long: translations.calendar.timeZone(timeZoneLongLabel(props.timeZone, currentLocale.value, instant)),
    };
});
const describedby = computed(
    () => [field?.value.ariaDescribedby, zone.value ? `${id}tz` : undefined].filter(Boolean).join(' ') || undefined
);
// Pasting "14:30", "2:30 PM" or "14.30 Uhr" sets the time (Ark reads ISO dates only)
function pasteText(text: string) {
    const time = parseTimeText(text, props.withSeconds);
    if (!time) return false;
    set(time);
    return true;
}
</script>

<template>
    <!--
        Time field: type the digits one after another ("1430"), arrow keys change hour or minute – or pick from the
        list of times (every `step` minutes). Gives "HH:mm".
    -->
    <div :class="styles.base({ class: split.className })" :style="split.style">
        <div
            :class="styles.control()"
            :data-invalid="state.invalid || undefined"
            :data-disabled="state.disabled || undefined"
        >
            <DateInput.Root
                :class="styles.dateInput()"
                :ids="field ? { label: () => field!.ids.label } : undefined"
                :model-value="times"
                :granularity="withSeconds ? 'second' : 'minute'"
                :formatter="formatter"
                :placeholder-value="placeholder"
                v-bind="{ ...bounds, ...state }"
                :locale="currentLocale"
                should-force-leading-zeros
                :translations="translations.dateInput"
                @value-change="set(toTime($event.value[0] as DateValue | undefined, withSeconds))"
            >
                <DateInput.Control :class="styles.dateControl()">
                    <DateSegments
                        :index="0"
                        :label="field ? undefined : (split.rest['aria-label'] as string | undefined)"
                        :describedby="describedby"
                        :paste="pasteText"
                        :size="size"
                    />
                </DateInput.Control>
            </DateInput.Root>
            <template v-if="zone">
                <span :class="styles.timeZone()" aria-hidden="true">{{ zone.short }}</span>
                <span :id="`${id}tz`" hidden>{{ zone.long }}</span>
            </template>
            <input v-if="name" type="hidden" :name="name" :value="current ?? ''" />
            <button
                v-if="clearable && current && !state.disabled && !state.readOnly"
                type="button"
                :class="styles.clear()"
                :aria-label="translations.timePicker.clearTrigger"
                @click="set(null)"
            >
                <X :class="styles.clearIcon()" aria-hidden="true" />
            </button>
            <Select.Root
                :class="styles.timeSelect()"
                :collection="collection"
                :model-value="wall ? [wall] : []"
                :disabled="state.disabled || state.readOnly"
                :ids="{ label: `${id}list` }"
                :positioning="{ placement: 'bottom-end', gutter: 4 }"
                lazy-mount
                unmount-on-exit
                @value-change="set($event.value[0] ?? null)"
            >
                <Select.Label :class="styles.timeListLabel()">{{ translations.timePicker.trigger }}</Select.Label>
                <Select.Trigger :class="styles.trigger()">
                    <Clock :class="styles.triggerIcon()" aria-hidden="true" />
                </Select.Trigger>
                <Teleport to="body">
                    <Select.Positioner>
                        <Select.Content :class="list.content({ class: styles.timeList() })">
                            <Select.Item
                                v-for="item in collection.items"
                                :key="item.value"
                                :item="item"
                                :class="list.item()"
                            >
                                <Select.ItemText :class="list.itemText()">{{ item.label }}</Select.ItemText>
                                <Select.ItemIndicator>
                                    <Check :class="list.itemIndicator()" aria-hidden="true" />
                                </Select.ItemIndicator>
                            </Select.Item>
                        </Select.Content>
                    </Select.Positioner>
                </Teleport>
            </Select.Root>
        </div>
    </div>
</template>
