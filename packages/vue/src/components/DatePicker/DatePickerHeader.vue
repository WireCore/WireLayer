<script setup lang="ts">
import { DatePicker } from '@ark-ui/vue/date-picker';
import { ChevronLeft, ChevronRight } from '@lucide/vue';
import { datePicker as datePickerRecipe } from '@wirecore/wirelayer-recipes';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';
const datePicker = useRecipe('datePicker', datePickerRecipe);

const translations = useTranslations();

const styles = datePicker();
// The button shows "October 2026" – its name has to contain that text too (WCAG 2.5.3)
const next = { day: 'month', month: 'year', year: undefined } as const;
const viewName = (text: string, view: 'day' | 'month' | 'year') =>
    `${text}, ${translations.datePicker.viewTrigger(view, next[view])}`;
</script>

<template>
    <!-- Previous / view switch ("October 2026") / next -->
    <DatePicker.ViewControl :class="styles.header()">
        <DatePicker.PrevTrigger :class="styles.nav()">
            <ChevronLeft :class="styles.navIcon()" aria-hidden="true" />
        </DatePicker.PrevTrigger>
        <DatePicker.Context v-slot="api">
            <DatePicker.ViewTrigger
                :class="styles.viewTrigger()"
                :aria-label="
                    viewName(
                        api.numOfMonths > 1 && api.view === 'day'
                            ? api.visibleRangeText.formatted
                            : api.visibleRangeText.start,
                        api.view
                    )
                "
            >
                <DatePicker.RangeText />
            </DatePicker.ViewTrigger>
        </DatePicker.Context>
        <DatePicker.NextTrigger :class="styles.nav()">
            <ChevronRight :class="styles.navIcon()" aria-hidden="true" />
        </DatePicker.NextTrigger>
    </DatePicker.ViewControl>
</template>
