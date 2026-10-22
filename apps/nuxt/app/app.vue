<script setup lang="ts">
import { Gauge, Send } from '@lucide/vue';
import { ModeToggle } from '@wirecore/wirelayer-blocks-vue';
import { modeScript } from '@wirecore/wirelayer-recipes';
import {
    AppShell,
    ConfirmDialog,
    LocaleProvider,
    SegmentedControl,
    SegmentedControlItem,
    SidebarNav,
    Toaster,
} from '@wirecore/wirelayer-vue';
import { computed } from 'vue';
import { useHead, useRoute } from '#imports';
import { useDemoLocale, usePageTexts } from '~/composables/useDemoLocale';

// Light/dark before the first paint (no flash while loading) – as in the docs
useHead({ script: [{ innerHTML: modeScript() }] });

const locale = useDemoLocale();
const t = usePageTexts();
const route = useRoute();
useHead(() => ({ htmlAttrs: { lang: locale.value } }));
const choose = (next: string | null) => {
    if (next === 'en-US' || next === 'de-DE') locale.value = next;
};

const navigation = computed(() => [
    { label: t.value.overview, href: '/', icon: Gauge, current: route.path === '/' },
    { label: t.value.request, href: '/anfrage', icon: Send, current: route.path === '/anfrage' },
]);
</script>

<template>
    <LocaleProvider :locale="locale">
        <AppShell>
            <template #header>
                <div class="flex flex-1 items-center justify-between gap-3">
                    <strong class="text-base">{{ t.title }}</strong>
                    <div class="flex items-center gap-2">
                        <SegmentedControl
                            :model-value="locale"
                            :label="t.language"
                            size="sm"
                            @update:model-value="choose"
                        >
                            <SegmentedControlItem value="en-US">EN</SegmentedControlItem>
                            <SegmentedControlItem value="de-DE">DE</SegmentedControlItem>
                        </SegmentedControl>
                        <ModeToggle />
                    </div>
                </div>
            </template>
            <template #navbar>
                <SidebarNav :items="navigation" :label="t.title" />
            </template>
            <NuxtPage />
        </AppShell>
        <Toaster />
        <ConfirmDialog />
    </LocaleProvider>
</template>
