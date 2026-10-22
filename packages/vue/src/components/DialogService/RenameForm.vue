<script setup lang="ts">
import { ref } from 'vue';
import Button from '../Button/Button.vue';
import Field from '../Field/Field.vue';
import Input from '../Input/Input.vue';

// Example content for the dialog service story
const props = defineProps<{ current: string; close: (result?: string) => void }>();
const name = ref(props.current);
</script>

<template>
    <form class="mt-2 flex flex-col gap-4" @submit.prevent="close(name)">
        <Field label="New name"><Input v-model="name" /></Field>
        <div class="flex justify-end gap-2">
            <Button variant="outline" size="sm" type="button" @click="close()">Cancel</Button>
            <Button size="sm" type="submit">Rename</Button>
        </div>
    </form>
</template>
