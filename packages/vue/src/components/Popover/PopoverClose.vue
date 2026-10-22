<script setup lang="ts">
import { ark } from '@ark-ui/vue/factory';
import { usePopoverContext } from '@ark-ui/vue/popover';

// Not Ark's CloseTrigger: that labels its element "close" and would replace the visible text as the accessible name
const popover = usePopoverContext();
</script>

<template>
    <ark.button as-child @click="popover.setOpen(false)"><slot /></ark.button>
</template>
