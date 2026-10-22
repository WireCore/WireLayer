<script setup lang="ts">
import { Steps } from '@ark-ui/vue/steps';
import { Check, LoaderCircle } from '@lucide/vue';
import { type RecipeClasses, stepper as stepperRecipe } from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, useAttrs } from 'vue';
import Button from '../Button/Button.vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

const translations = useTranslations();

export interface StepperItem {
    label: string;
    description?: string;
    /** The step is busy (e.g. saving): a spinner instead of its number, aria-busy on the step */
    loading?: boolean;
}

export interface StepperProps {
    items: StepperItem[];
    /** Current step (0-based; items.length = all done) – use with v-model:step */
    step?: number;
    defaultStep?: number;
    /** Steps only in order: no jumping ahead via the step list */
    linear?: boolean;
    /** Blocks "Next" while a step is not valid (with linear) */
    isStepValid?: (index: number) => boolean;
    /** Steps listed top to bottom beside the content */
    orientation?: 'horizontal' | 'vertical';
    /** Label beside the number (default) or below it */
    labelPlacement?: 'end' | 'bottom';
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof stepperRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<StepperProps>(), {
    step: undefined,
    defaultStep: 0,
    linear: false,
    isStepValid: undefined,
    orientation: 'horizontal',
    labelPlacement: 'end',
});
const stepper = useRecipe('stepper', stepperRecipe, () => props.classes);
const emit = defineEmits<{ 'update:step': [step: number] }>();
defineSlots<{ step(props: { index: number }): unknown; completed(): unknown }>();
const attrs = useAttrs();
const styles = computed(() =>
    stepper({ vertical: props.orientation === 'vertical', labelBottom: props.labelPlacement === 'bottom' })
);
const t = translations.stepper;
// null removes Ark's aria-current from the item (undefined would keep it)
const noCurrent = null as unknown as undefined;
</script>

<template>
    <!-- Steps list (tabs) with one panel per step and back/next buttons; the last "Next" finishes -->
    <Steps.Root
        :class="styles.base({ class: normalizeClass(attrs.class) })"
        :style="attrs.style"
        :count="items.length"
        :step="step"
        :default-step="defaultStep"
        :linear="linear"
        :is-step-valid="props.isStepValid"
        :orientation="orientation"
        @step-change="emit('update:step', $event.step)"
    >
        <Steps.List :class="styles.list()">
            <!-- Only a wrapper between tablist and tab: the tab itself is the selected step (aria-selected) -->
            <Steps.Item
                v-for="(item, index) in items"
                :key="index"
                :index="index"
                :class="styles.item()"
                role="presentation"
                :aria-current="noCurrent"
            >
                <Steps.Trigger :class="styles.trigger()" :aria-busy="item.loading || undefined">
                    <Steps.Indicator :class="styles.indicator()">
                        <Steps.ItemContext v-slot="state">
                            <LoaderCircle v-if="item.loading" :class="styles.spinner()" aria-hidden="true" />
                            <Check v-else-if="state.completed" :class="styles.indicatorIcon()" aria-hidden="true" />
                            <template v-else>{{ index + 1 }}</template>
                        </Steps.ItemContext>
                    </Steps.Indicator>
                    <span :class="styles.text()">
                        <span :class="styles.label()">{{ item.label }}</span>
                        <span v-if="item.description" :class="styles.description()">{{ item.description }}</span>
                    </span>
                </Steps.Trigger>
                <Steps.Separator v-if="index < items.length - 1" :class="styles.separator()" />
            </Steps.Item>
        </Steps.List>
        <Steps.Content v-for="(_, index) in items" :key="index" :index="index" :class="styles.content()">
            <slot name="step" :index="index" />
        </Steps.Content>
        <Steps.CompletedContent :class="styles.content()"><slot name="completed" /></Steps.CompletedContent>
        <Steps.Context v-slot="api">
            <div v-if="!api.isCompleted" :class="styles.actions()">
                <Steps.PrevTrigger as-child>
                    <Button variant="outline">{{ t.prev }}</Button>
                </Steps.PrevTrigger>
                <!-- With linear, an invalid step blocks going on – shown as a disabled button -->
                <Steps.NextTrigger as-child>
                    <Button :disabled="linear && !api.isStepValid(api.value)">{{
                        api.value === api.count - 1 ? t.finish : t.next
                    }}</Button>
                </Steps.NextTrigger>
            </div>
        </Steps.Context>
    </Steps.Root>
</template>
