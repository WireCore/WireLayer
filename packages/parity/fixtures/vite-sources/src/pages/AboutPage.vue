<script setup lang="ts">
// Fixture of the Vite plugin test: a Vue file and a recipe used directly
import { Badge } from '@wirecore/wirelayer-vue';
import { prose } from '@wirecore/wirelayer-recipes';
</script>

<template>
    <article :class="prose()"><Badge>New</Badge></article>
</template>
