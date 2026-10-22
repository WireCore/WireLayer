<script setup lang="ts">
import {
    addDays,
    parseLocal,
    pluralText,
    scheduler as schedulerRecipe,
    toIsoDate,
    visibleDays,
    type PluralForms,
} from '@wirecore/wirelayer-recipes';
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue';

// Year view of the Scheduler: twelve small months, days with events marked (dot, bold and in the name); one day is
// in the tab order, the arrow keys move between days (Page Up/Down: months), Enter opens the day

const props = defineProps<{
    year: number;
    /** Current date of the Scheduler (ISO) – the day in the tab order when it lies in the year */
    date: string;
    /** Number of events per day */
    counts: Map<string, number>;
    /** Today (ISO), null on the server */
    today: string | null;
    weekStartsOn: number;
    locale: string;
    rtl: boolean;
    headingLevel: number;
    eventCount: PluralForms;
    styles: ReturnType<typeof schedulerRecipe>;
}>();
const emit = defineEmits<{ open: [day: Date]; month: [day: Date] }>();

const format = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(props.locale, options);
const months = computed(() =>
    Array.from({ length: 12 }, (_, month) => {
        const first = new Date(props.year, month, 1);
        const days = visibleDays('month', first, props.weekStartsOn);
        return {
            first,
            name: format({ month: 'long' }).format(first),
            weeks: Array.from({ length: days.length / 7 }, (_, index) => days.slice(index * 7, index * 7 + 7)),
        };
    })
);
const weekdays = computed(() =>
    visibleDays('week', new Date(props.year, 0, 4), props.weekStartsOn).map((day) =>
        format({ weekday: 'narrow' }).format(day)
    )
);

const inYear = (iso: string) => iso.startsWith(`${props.year}-`);
const active = ref(inYear(props.date) ? props.date : `${props.year}-01-01`);
watch(
    () => [props.year, props.date],
    () => (active.value = inYear(props.date) ? props.date : `${props.year}-01-01`)
);
const label = (day: Date) => {
    const count = props.counts.get(toIsoDate(day)) ?? 0;
    const date = format({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(day);
    return count ? `${date}, ${pluralText(props.eventCount, count, props.locale)}` : date;
};

const root = useTemplateRef<HTMLElement>('root');
async function onKey(day: Date, key: KeyboardEvent) {
    const step = props.rtl ? -1 : 1;
    const moves: Record<string, () => Date> = {
        ArrowLeft: () => addDays(day, -step),
        ArrowRight: () => addDays(day, step),
        ArrowUp: () => addDays(day, -7),
        ArrowDown: () => addDays(day, 7),
        PageUp: () => new Date(day.getFullYear(), day.getMonth() - 1, Math.min(day.getDate(), 28)),
        PageDown: () => new Date(day.getFullYear(), day.getMonth() + 1, Math.min(day.getDate(), 28)),
        Home: () => new Date(day.getFullYear(), day.getMonth(), 1),
        End: () => new Date(day.getFullYear(), day.getMonth() + 1, 0),
    };
    const move = moves[key.key];
    if (!move) return;
    key.preventDefault();
    const next = toIsoDate(move());
    if (!inYear(next)) return;
    active.value = next;
    await nextTick();
    root.value?.querySelector<HTMLElement>(`[data-date="${next}"]`)?.focus();
}
</script>

<template>
    <div ref="root" :class="styles.year()">
        <section v-for="month in months" :key="month.first.getMonth()" :class="styles.yearMonth()">
            <component :is="`h${headingLevel}`">
                <button type="button" :class="styles.yearMonthTitle()" @click="emit('month', month.first)">
                    {{ month.name }}
                </button>
            </component>
            <table
                :class="styles.yearTable()"
                :aria-label="format({ month: 'long', year: 'numeric' }).format(month.first)"
            >
                <thead>
                    <tr>
                        <th v-for="(weekday, index) in weekdays" :key="index" scope="col" :class="styles.yearHead()">
                            {{ weekday }}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="week in month.weeks" :key="week[0]!.getTime()">
                        <td v-for="day in week" :key="day.getTime()" :class="styles.yearCell()">
                            <button
                                v-if="day.getMonth() === month.first.getMonth()"
                                type="button"
                                :class="styles.yearDay()"
                                :data-date="toIsoDate(day)"
                                :data-marked="counts.has(toIsoDate(day)) || undefined"
                                :tabindex="toIsoDate(day) === active ? 0 : -1"
                                :aria-label="label(day)"
                                :aria-current="toIsoDate(day) === today ? 'date' : undefined"
                                @click="emit('open', parseLocal(toIsoDate(day)))"
                                @focus="active = toIsoDate(day)"
                                @keydown="onKey(day, $event)"
                            >
                                {{ day.getDate()
                                }}<span
                                    v-if="counts.has(toIsoDate(day))"
                                    :class="styles.yearMark()"
                                    aria-hidden="true"
                                />
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </section>
    </div>
</template>
