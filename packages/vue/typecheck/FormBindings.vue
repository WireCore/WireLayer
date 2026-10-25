<script setup lang="ts">
// Type test, checked by vue-tsc in `pnpm typecheck` (not part of the package): the bind helpers of /form fit the
// components they are meant for in a compiled SFC template
import { useForm } from '@tanstack/vue-form';
import Autocomplete from '../src/components/Autocomplete/Autocomplete.vue';
import Checkbox from '../src/components/Checkbox/Checkbox.vue';
import ColorInput from '../src/components/ColorInput/ColorInput.vue';
import Input from '../src/components/Input/Input.vue';
import JsonInput from '../src/components/JsonInput/JsonInput.vue';
import MaskInput from '../src/components/MaskInput/MaskInput.vue';
import Mentions from '../src/components/Mentions/Mentions.vue';
import PasswordInput from '../src/components/PasswordInput/PasswordInput.vue';
import PhoneInput from '../src/components/PhoneInput/PhoneInput.vue';
import PinInput from '../src/components/PinInput/PinInput.vue';
import SearchField from '../src/components/SearchField/SearchField.vue';
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
    <form.Field v-slot="{ field }" name="name">
        <PasswordInput v-bind="bindInput(field)" aria-label="Password" />
        <SearchField v-bind="bindInput(field)" label="Search" />
        <MaskInput v-bind="bindInput(field)" mask="99999" aria-label="Postcode" />
        <PhoneInput v-bind="bindInput(field)" aria-label="Phone" />
        <ColorInput v-bind="bindInput(field)" aria-label="Colour" />
        <JsonInput v-bind="bindInput(field)" aria-label="Settings" />
        <PinInput v-bind="bindInput(field)" aria-label="Code" />
        <Mentions v-bind="bindInput(field)" :items="services" aria-label="Comment" />
        <Autocomplete v-bind="bindInput(field)" :items="services" aria-label="City" />
    </form.Field>
    <form.Field v-slot="{ field }" name="terms"><Checkbox v-bind="bindCheckbox(field)" label="Terms" /></form.Field>
    <form.Field v-slot="{ field }" name="newsletter"><Switch v-bind="bindCheckbox(field)" label="News" /></form.Field>
    <form.Field v-slot="{ field }" name="service">
        <Select v-bind="bindValue(field)" :items="services" aria-label="Service" />
    </form.Field>
</template>
