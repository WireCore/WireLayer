<script setup lang="ts">
import { LocaleProvider as ArkLocaleProvider } from '@ark-ui/vue/locale';
import { defaultLocale, resolveLocalizedLocale, type Translations } from '@wirecore/wirelayer-recipes';
import { computed } from 'vue';
import { provideLocale } from '../../locale.js';

export interface LocaleProviderProps {
    /** BCP 47 tag, e.g. "en-US": texts, number and date formats and the writing direction */
    locale?: string;
    /** Texts of the language, e.g. `fr` from `locales/fr` – else built in (de, en), registerLocale or English */
    translations?: Translations;
}

const props = withDefaults(defineProps<LocaleProviderProps>(), { locale: defaultLocale, translations: undefined });

// Numbers in the texts follow the locale (digits, grouping) – see localizeTexts
provideLocale(computed(() => resolveLocalizedLocale(props.locale, props.translations)));
</script>

<template>
    <!-- Renders nothing itself; Ark's provider passes locale and direction (keyboard order) on to Ark -->
    <ArkLocaleProvider :locale="locale">
        <slot />
    </ArkLocaleProvider>
</template>
