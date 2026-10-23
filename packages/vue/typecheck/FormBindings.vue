<script setup lang="ts">
// Type test, checked by vue-tsc in `pnpm typecheck` (not part of the package): the bind helpers of /form fit the
// components they are meant for in a compiled SFC template
import { useForm } from '@tanstack/vue-form';
import Checkbox from '../src/components/Checkbox/Checkbox.vue';
import Input from '../src/components/Input/Input.vue';
import Select from '../src/components/Select/Select.vue';
import Switch from '../src/components/Switch/Switch.vue';
import Textarea from '../src/components/Textarea/Textarea.vue';
import { bindCheckbox, bindInput, bindValue } from '../src/form/bind.js';

const form = useForm({ defaultValues: { name: '', note: '', terms: false, newsletter: false, service: 'web' } });
const services = [{ value: 'web', label: 'Web' }];
</script>

<template>
    <form.Field v-slot="{ field }" name="name"><Input v-bind="bindInput(field)" aria-label="Name" /></form.Field>
    <form.Field v-slot="{ field }" name="note"><Textarea v-bind="bindInput(field)" aria-label="Note" /></form.Field>
    <form.Field v-slot="{ field }" name="terms"><Checkbox v-bind="bindCheckbox(field)" label="Terms" /></form.Field>
    <form.Field v-slot="{ field }" name="newsletter"><Switch v-bind="bindCheckbox(field)" label="News" /></form.Field>
    <form.Field v-slot="{ field }" name="service">
        <Select v-bind="bindValue(field)" :items="services" aria-label="Service" />
    </form.Field>
</template>
