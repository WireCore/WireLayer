<script setup lang="ts">
import { heatLevel, heatmap as heatmapRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, useAttrs } from 'vue';
import { useRecipe } from '../../recipes.js';
import { useLocale, useTranslations } from '../../locale.js';

export interface HeatmapProps {
    /** Title of the table (caption) */
    caption: string;
    /** Row names */
    rows: string[];
    /** Column names */
    columns: string[];
    /** Values per row and column; null for no value */
    values: (number | null)[][];
    /** Range of the colours (default: smallest and largest value) */
    min?: number;
    max?: number;
    /** The values as text in the cells – without, they stay readable for screen readers and as tooltip */
    showValues?: boolean;
    /** Colour scale below the table */
    legend?: boolean;
    formatOptions?: Intl.NumberFormatOptions;
    locale?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof heatmapRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<HeatmapProps>(), {
    min: undefined,
    max: undefined,
    showValues: true,
    legend: true,
});
const heatmap = useRecipe('heatmap', heatmapRecipe, () => props.classes);
const attrs = useAttrs();
const styles = computed(() => heatmap());
const localeContext = useLocale();
const t = useTranslations().heatmap;

const numbers = computed(() =>
    props.values.flat().filter((value): value is number => typeof value === 'number' && !Number.isNaN(value))
);
const low = computed(() => props.min ?? Math.min(...numbers.value, 0));
const high = computed(() => props.max ?? Math.max(...numbers.value, 0));
const format = (value: number) =>
    new Intl.NumberFormat(props.locale ?? localeContext.value.locale, props.formatOptions).format(value);
const cell = (row: number, column: number) => {
    const value = props.values[row]?.[column] ?? null;
    return { text: value === null ? null : format(value), level: heatLevel(value, low.value, high.value) };
};
</script>

<template>
    <!-- A real table: row and column headers name every value; the colour only adds to the number -->
    <div v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }">
        <div :class="styles.scroll()">
            <table :class="styles.table()">
                <caption :class="styles.caption()">
                    {{
                        caption
                    }}
                </caption>
                <thead>
                    <tr>
                        <td />
                        <th v-for="column in columns" :key="column" scope="col" :class="styles.columnHeader()">
                            {{ column }}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(row, rowIndex) in rows" :key="row">
                        <th scope="row" :class="styles.rowHeader()">{{ row }}</th>
                        <td
                            v-for="(column, columnIndex) in columns"
                            :key="column"
                            :class="styles.cell()"
                            :data-level="cell(rowIndex, columnIndex).level ?? undefined"
                            :title="showValues ? undefined : (cell(rowIndex, columnIndex).text ?? undefined)"
                        >
                            <template v-if="cell(rowIndex, columnIndex).text === null">
                                <span :class="styles.empty()" aria-hidden="true">–</span>
                                <span :class="styles.srOnly()">{{ t.empty }}</span>
                            </template>
                            <template v-else-if="showValues">{{ cell(rowIndex, columnIndex).text }}</template>
                            <span v-else :class="styles.srOnly()">{{ cell(rowIndex, columnIndex).text }}</span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div v-if="legend" :class="styles.legend()" aria-hidden="true">
            <span>{{ t.less }}</span>
            <span v-for="level in [0, 1, 2, 3, 4]" :key="level" :class="styles.legendCell()" :data-level="level" />
            <span>{{ t.more }}</span>
        </div>
    </div>
</template>
