import { registerLocale } from '@wirecore/wirelayer-vue';
import { de } from '@wirecore/wirelayer-vue/locales/de';
import { defineNuxtPlugin } from '#imports';

// German is a separate language module – registered once, before the first render (server and browser)
export default defineNuxtPlugin(() => {
    registerLocale('de', de);
});
