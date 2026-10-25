<script setup lang="ts">
import { DatePicker, useDatePickerContext, type DateValue } from '@ark-ui/vue/date-picker';
import {
    datePicker as datePickerRecipe,
    isoWeekday,
    rowWeekNumber,
    type CalendarDayState,
} from '@wirecore/wirelayer-recipes';
import { computed } from 'vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

const translations = useTranslations();

// The days of one month as grid: optional week numbers, own day content, deselecting the chosen day

const props = defineProps<{
    weeks: DateValue[][];
    /** The month of this table when several are shown – days outside it are outside days */
    visibleRange?: { start: DateValue; end: DateValue };
    showWeekNumbers?: boolean;
    plainToday?: boolean;
    hideOutsideDays?: boolean;
    weekendDays?: readonly number[];
    allowDeselect?: boolean;
}>();
defineSlots<{ day?(props: { date: string } & CalendarDayState): unknown }>();
const datePicker = useRecipe('datePicker', datePickerRecipe);
const styles = computed(() => datePicker({ plainToday: props.plainToday, hideOutsideDays: props.hideOutsideDays }));
const api = useDatePickerContext();

const isoOf = (day: DateValue) => day.toString().slice(0, 10);
const outsideMonth = (day: DateValue) =>
    !!props.visibleRange &&
    (day.month !== props.visibleRange.start.month || day.year !== props.visibleRange.start.year);
const weekNumber = (week: DateValue[]) => rowWeekNumber(week.map(isoOf));
function stateOf(day: DateValue): CalendarDayState {
    const state = api.value.getDayTableCellState({ value: day, visibleRange: props.visibleRange });
    return {
        day: day.day,
        today: state.today,
        selected: state.selected,
        outside: state.outsideRange,
        unavailable: state.unavailable || !!state.disabled,
        weekend: props.weekendDays ? props.weekendDays.includes(isoWeekday(isoOf(day))) : state.weekend,
    };
}

// allowDeselect: the chosen day again (click, Enter, Space) clears a single date
const canDeselect = (day: DateValue) =>
    api.value.selectionMode === 'single' &&
    api.value.getDayTableCellState({ value: day, visibleRange: props.visibleRange }).selected;
function deselect(event: Event, day: DateValue) {
    if (event instanceof KeyboardEvent && event.key !== 'Enter' && event.key !== ' ') return;
    if (!canDeselect(day)) return;
    event.preventDefault();
    api.value.clearValue({ focus: false });
}
// On the cell, before Ark's own handlers (capture): own weekend days and deselecting. Nothing extra on the
// default calendar – same DOM and handlers as before
function cellAttrs(day: DateValue) {
    const attrs: Record<string, unknown> = {};
    if (props.weekendDays?.includes(isoWeekday(isoOf(day)))) attrs['data-weekend'] = '';
    if (props.allowDeselect) {
        attrs.onClickCapture = (event: MouseEvent) => deselect(event, day);
        attrs.onKeydownCapture = (event: KeyboardEvent) => deselect(event, day);
    }
    return attrs;
}
</script>

<template>
    <DatePicker.Table :class="styles.table()">
        <DatePicker.TableHead>
            <DatePicker.TableRow>
                <th v-if="showWeekNumbers" scope="col" :class="styles.weekNumberHeader()">
                    <abbr :title="translations.datePicker.weekColumnHeader">{{
                        translations.datePicker.weekColumnShort
                    }}</abbr>
                </th>
                <DatePicker.TableHeader v-for="day in api.weekDays" :key="day.long" :class="styles.columnHeader()">
                    <abbr :title="day.long">{{ day.short }}</abbr>
                </DatePicker.TableHeader>
            </DatePicker.TableRow>
        </DatePicker.TableHead>
        <DatePicker.TableBody>
            <DatePicker.TableRow v-for="week in weeks" :key="week[0]?.toString()">
                <th
                    v-if="showWeekNumbers"
                    scope="row"
                    :class="styles.weekNumber()"
                    :aria-label="translations.datePicker.weekNumberCell(weekNumber(week))"
                >
                    {{ weekNumber(week) }}
                </th>
                <template v-for="day in week" :key="day.toString()">
                    <!-- Several months: a day of the neighbour month is shown in that month only (unique ids) -->
                    <td v-if="outsideMonth(day)" :class="styles.cell()" />
                    <DatePicker.TableCell
                        v-else
                        :value="day"
                        :visible-range="visibleRange"
                        :class="styles.cell()"
                        v-bind="cellAttrs(day)"
                    >
                        <DatePicker.TableCellTrigger :class="styles.day()">
                            <span v-if="$slots.day" :class="styles.dayContent()">
                                <slot name="day" :date="isoOf(day)" v-bind="stateOf(day)" />
                            </span>
                            <template v-else>{{ day.day }}</template>
                        </DatePicker.TableCellTrigger>
                    </DatePicker.TableCell>
                </template>
            </DatePicker.TableRow>
        </DatePicker.TableBody>
    </DatePicker.Table>
</template>
