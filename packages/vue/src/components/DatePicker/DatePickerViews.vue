<script setup lang="ts">
import { DatePicker, type DateValue, type UseDatePickerContext } from '@ark-ui/vue/date-picker';
import { datePicker as datePickerRecipe, todayIso, type CalendarDayState } from '@wirecore/wirelayer-recipes';
import { computed } from 'vue';
import DatePickerDayTable from './DatePickerDayTable.vue';
import DatePickerHeader from './DatePickerHeader.vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

const translations = useTranslations();

/** A named range ("Last 7 days"): one of Ark's presets or own dates */
export type CalendarPreset = string | { label: string; value: DateValue[] };

/** Calendar options shared by DatePicker, DateRangePicker and Calendar */
export interface CalendarViewOptions {
    showWeekNumbers?: boolean;
    numberOfMonths?: number;
    showButtonBar?: boolean;
    /** highlightToday false: today without its own style */
    plainToday?: boolean;
    hideOutsideDays?: boolean;
    weekendDays?: number[];
    allowDeselect?: boolean;
    /** "Today" in this zone */
    timeZone?: string;
}

const props = defineProps<{ presets?: CalendarPreset[] } & CalendarViewOptions>();
defineSlots<{ day?(props: { date: string } & CalendarDayState): unknown }>();
const datePicker = useRecipe('datePicker', datePickerRecipe);
const styles = datePicker();
const presetLabel = (preset: CalendarPreset) =>
    typeof preset === 'string' ? (translations.rangePresets[preset] ?? preset) : preset.label;

const monthCount = computed(() => Math.max(1, Math.floor(props.numberOfMonths ?? 1)));
const tableOptions = computed(() => ({
    showWeekNumbers: props.showWeekNumbers,
    plainToday: props.plainToday,
    // Several months: the days of the neighbour months would show twice
    hideOutsideDays: props.hideOutsideDays || monthCount.value > 1,
    weekendDays: props.weekendDays,
    allowDeselect: props.allowDeselect,
}));
// Several months side by side: each table gets its own month as visible range
function monthTables(api: UseDatePickerContext['value']) {
    return Array.from({ length: monthCount.value }, (_, index) => {
        const offset = api.getOffset({ months: index });
        const start = api.visibleRange.start.add({ months: index });
        return {
            title: offset.visibleRangeText.start,
            weeks: offset.weeks,
            visibleRange: { start, end: start.add({ months: 1 }).subtract({ days: 1 }) },
        };
    });
}
// "Today": picks today (one date) or shows it (range, several dates)
function today(api: UseDatePickerContext['value']) {
    if (api.selectionMode === 'single') return api.selectToday();
    const [year = 0, month = 1, day = 1] = todayIso(props.timeZone).split('-').map(Number);
    api.setFocusedValue(api.focusedValue.set({ year, month, day }));
}
</script>

<template>
    <!-- Day, month and year views (arrow keys, Page Up/Down, Home/End), optional range presets below -->
    <DatePicker.View view="day">
        <DatePicker.Context v-slot="api">
            <DatePickerHeader />
            <div v-if="monthCount > 1" :class="styles.months()">
                <div v-for="month in monthTables(api)" :key="month.title" :class="styles.month()">
                    <div :class="styles.monthTitle()">{{ month.title }}</div>
                    <DatePickerDayTable :weeks="month.weeks" :visible-range="month.visibleRange" v-bind="tableOptions">
                        <template v-if="$slots.day" #day="state"><slot name="day" v-bind="state" /></template>
                    </DatePickerDayTable>
                </div>
            </div>
            <DatePickerDayTable v-else :weeks="api.weeks" v-bind="tableOptions">
                <template v-if="$slots.day" #day="state"><slot name="day" v-bind="state" /></template>
            </DatePickerDayTable>
        </DatePicker.Context>
    </DatePicker.View>
    <DatePicker.View view="month">
        <DatePicker.Context v-slot="api">
            <DatePickerHeader />
            <DatePicker.Table :class="styles.table()">
                <DatePicker.TableBody>
                    <DatePicker.TableRow
                        v-for="months in api.getMonthsGrid({ columns: 4, format: 'short' })"
                        :key="months[0]?.value"
                    >
                        <DatePicker.TableCell
                            v-for="month in months"
                            :key="month.value"
                            :value="month.value"
                            :class="styles.cell()"
                        >
                            <DatePicker.TableCellTrigger :class="styles.period()">
                                {{ month.label }}
                            </DatePicker.TableCellTrigger>
                        </DatePicker.TableCell>
                    </DatePicker.TableRow>
                </DatePicker.TableBody>
            </DatePicker.Table>
        </DatePicker.Context>
    </DatePicker.View>
    <DatePicker.View view="year">
        <DatePicker.Context v-slot="api">
            <DatePickerHeader />
            <DatePicker.Table :class="styles.table()">
                <DatePicker.TableBody>
                    <DatePicker.TableRow v-for="years in api.getYearsGrid({ columns: 4 })" :key="years[0]?.value">
                        <DatePicker.TableCell
                            v-for="year in years"
                            :key="year.value"
                            :value="year.value"
                            :class="styles.cell()"
                        >
                            <DatePicker.TableCellTrigger :class="styles.period()">
                                {{ year.label }}
                            </DatePicker.TableCellTrigger>
                        </DatePicker.TableCell>
                    </DatePicker.TableRow>
                </DatePicker.TableBody>
            </DatePicker.Table>
        </DatePicker.Context>
    </DatePicker.View>
    <div v-if="presets?.length" :class="styles.presets()">
        <DatePicker.PresetTrigger
            v-for="preset in presets"
            :key="presetLabel(preset)"
            :value="typeof preset === 'string' ? (preset as never) : preset.value"
            :class="styles.preset()"
            :aria-label="presetLabel(preset)"
        >
            {{ presetLabel(preset) }}
        </DatePicker.PresetTrigger>
    </div>
    <DatePicker.Context v-if="showButtonBar" v-slot="api">
        <div :class="styles.buttonBar()">
            <button type="button" :class="styles.buttonBarButton()" @click="today(api)">
                {{ translations.calendar.today }}
            </button>
            <button
                type="button"
                :class="styles.buttonBarButton()"
                :disabled="!api.value.length"
                @click="api.clearValue({ focus: false })"
            >
                {{ translations.calendar.clear }}
            </button>
        </div>
    </DatePicker.Context>
</template>
