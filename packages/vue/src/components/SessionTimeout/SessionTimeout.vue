<script setup lang="ts">
import { Clock } from '@lucide/vue';
import {
    formatRemaining,
    sessionTimeout as sessionTimeoutRecipe,
    sessionTimeoutState,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import Button from '../Button/Button.vue';
import Dialog from '../Dialog/Dialog.vue';
import DialogContent from '../Dialog/DialogContent.vue';
import { useLocale } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface SessionTimeoutProps {
    /** When the session ends: ISO text, timestamp or Date – set it anew after extending */
    expiresAt: string | number | Date;
    /** Seconds before the end the warning opens (default 120 – WCAG 2.2.1 asks for at least 20) */
    warnBefore?: number;
    /** Heading of the warning */
    title?: string;
    /** Text of the warning */
    description?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof sessionTimeoutRecipe>;
}

const props = withDefaults(defineProps<SessionTimeoutProps>(), { warnBefore: 120 });
const emit = defineEmits<{
    /** "Stay signed in": extend the session and pass the new expiresAt */
    extend: [];
    /** "Sign out" in the warning */
    signOut: [];
    /** The time ran out */
    expire: [];
}>();
const sessionTimeout = useRecipe('sessionTimeout', sessionTimeoutRecipe, () => props.classes);
const locale = useLocale();
const t = computed(() => locale.value.translations.sessionTimeout);
const styles = sessionTimeout();

// The clock runs only in the browser – the server renders nothing
const now = ref<number | null>(null);
let timer: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
    now.value = Date.now();
    timer = setInterval(() => (now.value = Date.now()), 1000);
});
onBeforeUnmount(() => clearInterval(timer));

const expires = computed(() => new Date(props.expiresAt).getTime());
const state = computed(() =>
    now.value === null ? null : sessionTimeoutState(expires.value, now.value, props.warnBefore * 1000)
);
// Closed by the user (Escape, "Close") – opens again for the next expiry time
const dismissed = ref(false);
watch(expires, () => (dismissed.value = false));
const open = computed(() => !!state.value && (state.value.warn || state.value.expired) && !dismissed.value);
watch(
    () => state.value?.expired,
    (expired) => {
        if (expired) emit('expire');
    }
);
function extend() {
    emit('extend');
}
function signOut() {
    dismissed.value = true;
    emit('signOut');
}
</script>

<template>
    <!--
        Session timeout warning (WCAG 2.2.1): an alert dialog shortly before the session ends, with the time left and
        one action to stay signed in; after the end it says so.
    -->
    <Dialog :open="open" role="alertdialog" @update:open="(value: boolean) => !value && (dismissed = true)">
        <DialogContent
            v-if="state"
            :title="state.expired ? t.expiredTitle : (title ?? t.title)"
            :description="state.expired ? t.expired : (description ?? t.description)"
            :icon="Clock"
            :status="state.expired ? 'danger' : 'warn'"
            size="sm"
        >
            <div v-if="!state.expired" :class="styles.base()">
                <span :class="styles.text()">{{ t.remaining }}</span>
                <span role="timer" :class="styles.remaining()">{{ formatRemaining(state.remaining) }}</span>
            </div>
            <template #footer>
                <template v-if="state.expired">
                    <Button size="sm" @click="dismissed = true">{{ t.close }}</Button>
                </template>
                <template v-else>
                    <!-- The safe action first: it takes the focus when the warning opens -->
                    <Button size="sm" @click="extend">{{ t.extend }}</Button>
                    <Button size="sm" variant="outline" @click="signOut">{{ t.signOut }}</Button>
                </template>
            </template>
        </DialogContent>
    </Dialog>
</template>
