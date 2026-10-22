import tailwindcss from '@tailwindcss/vite';

// Set up exactly as in Storybook › Getting started › Welcome › Nuxt
export default defineNuxtConfig({
    compatibilityDate: '2026-10-01',
    css: ['~/assets/main.css'],
    vite: { plugins: [tailwindcss()] },
    app: { head: { link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }] } },
    devtools: { enabled: false },
    telemetry: false,
});
