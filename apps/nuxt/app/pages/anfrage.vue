<script setup lang="ts">
import { Send } from '@lucide/vue';
import { Button, Checkbox, confirm, DatePicker, Field, Input, Select, toast } from '@wirecore/wirelayer-vue';
import { ref } from 'vue';
import { useHead } from '#imports';
import { usePageTexts } from '~/composables/useDemoLocale';

const t = usePageTexts();
useHead(() => ({ title: `${t.value.request} · ${t.value.title}` }));

const services = [
    { value: 'web', label: 'Software & Web' },
    { value: 'hosting', label: 'Managed Hosting' },
    { value: 'cloud', label: 'Cloud & DevOps' },
];
const name = ref('');
const email = ref('');
const service = ref<string | null>(null);
const date = ref<string | null>(null);
const consent = ref(false);
const submitted = ref(false);
const missing = (value: unknown) => submitted.value && !value;

async function submit() {
    submitted.value = true;
    if (!name.value || !email.value || !service.value || !consent.value) return;
    if (!(await confirm({ title: t.value.confirm }))) return;
    toast({ title: t.value.sent, description: `${name.value} · ${service.value}`, type: 'success' });
}
</script>

<template>
    <form class="flex max-w-lg flex-col gap-4 p-6" novalidate @submit.prevent="submit">
        <h1 class="text-2xl font-semibold">{{ t.request }}</h1>
        <Field :label="t.name" required :error="missing(name) ? t.required : undefined">
            <Input v-model="name" autocomplete="name" />
        </Field>
        <Field :label="t.email" required :error="missing(email) ? t.required : undefined">
            <Input v-model="email" type="email" autocomplete="email" />
        </Field>
        <Field :label="t.service" required :error="missing(service) ? t.required : undefined">
            <Select v-model="service" :items="services" />
        </Field>
        <Field :label="t.date">
            <DatePicker v-model="date" />
        </Field>
        <Checkbox v-model:checked="consent" :invalid="missing(consent)">{{ t.consent }}</Checkbox>
        <Button type="submit" :trailing-icon="Send" class="self-start">{{ t.send }}</Button>
    </form>
</template>
